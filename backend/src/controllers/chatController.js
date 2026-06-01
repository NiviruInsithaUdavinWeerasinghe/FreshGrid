const { GoogleGenerativeAI } = require('@google/generative-ai');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const ChatHistory = require('../models/ChatHistory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const chatTools = [
  {
    name: 'navigate',
    description: 'Navigate the user to a different page on the storefront.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'The URL path to navigate to (e.g., /cart, /shop, /, /account)'
        },
        scrollTo: {
          type: 'string',
          description: "Optional. 'top', 'bottom', or a specific section ID (e.g., 'footer') to scroll to after navigating."
        },
        reply: {
          type: 'string',
          description: 'A conversational response telling the user what you are doing.'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'manage_cart',
    description: 'Add, remove, update, or clear items in the users cart.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: "Action to perform ('add', 'remove', 'update', 'checkout', 'clear', 'set_delivery_type')"
        },
        deliveryType: {
          type: 'string',
          description: "Required if action is 'set_delivery_type'. Either 'home' or 'live'."
        },
        paymentMethod: {
          type: 'string',
          description: "Required if action is 'set_payment_method'. Either 'Card' or 'Cash'."
        },
        productId: {
          type: 'string',
          description: 'The MongoDB ObjectId of the product, required for add, remove, and update.'
        },
        quantity: {
          type: 'number',
          description: 'The quantity to add or update. Defaults to 1 if not specified.'
        },
        reply: {
          type: 'string',
          description: 'A conversational response telling the user what cart action was taken.'
        }
      },
      required: ['action']
    }
  },
  {
    name: 'search_products',
    description: 'Trigger a product search on the frontend with specific criteria.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term'
        },
        category: {
          type: 'string',
          description: 'Category name'
        },
        reply: {
          type: 'string',
          description: 'A conversational response providing the product information or prices they asked for, while telling them you are searching.'
        }
      }
    }
  },
  {
    name: 'answer_knowledge',
    description: 'Provide an answer from the knowledge base regarding policies, delivery, or general store questions.',
    parameters: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          description: 'The full text answer to display to the user.'
        }
      },
      required: ['answer']
    }
  },
  {
    name: 'manage_subscription',
    description: 'Subscribe the user to promotional emails.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: "Must be 'subscribe'."
        },
        reply: {
          type: 'string',
          description: 'A conversational response telling the user you are subscribing them or telling them to log in if needed.'
        }
      },
      required: ['action', 'reply']
    }
  },
  {
    name: 'navigate_shop_pagination',
    description: 'Navigate to a specific page or next/prev page in the shop.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: "'next', 'prev', or 'specific'"
        },
        page: {
          type: 'number',
          description: 'The specific page number if action is specific.'
        },
        reply: {
          type: 'string',
          description: 'A conversational response confirming the page change.'
        }
      },
      required: ['action', 'reply']
    }
  },
  {
    name: 'close_chat',
    description: 'Close or minimize the AI chat widget UI.',
    parameters: {
      type: 'object',
      properties: {
        reply: {
          type: 'string',
          description: 'A conversational farewell message before closing.'
        }
      }
    }
  }
];

const systemInstruction = `You are a highly capable AI Shopping Assistant for FreshGrid, functioning like an all-knowing Doraemon for this website. 
Your goal is to help users navigate, manage their cart, find products, and answer policy questions.
You MUST ALWAYS use the provided tools to interact with the user or perform actions.
- Use 'navigate' to take users to specific pages. If they ask to scroll to the bottom, top, or a specific section, use the 'scrollTo' parameter (e.g., scrollTo: 'bottom', scrollTo: 'top', or scrollTo: '#featured-harvest').
- Use 'manage_cart' to modify their shopping cart.
- Use 'search_products' to redirect them to a filtered shop view. If a user asks to see a specific category on the shop page (like "Special Offers" or "Fruits"), use this tool with the 'category' parameter instead of 'navigate'.
- Use 'manage_subscription' to subscribe them to promotional emails.
- Use 'navigate_shop_pagination' to go to the next/prev page in the shop.
- Use 'answer_knowledge' to give textual answers to general questions. Do not just return text, always return a function call.
- Use 'close_chat' to close the chat interface when the user asks to close it, dismiss it, or say goodbye if they want to leave.

CRITICAL INSTRUCTIONS:
1. When a user asks about products (e.g., "What vegetables do you have?"), you MUST use the data provided in the "Relevant Products from DB" context to give a full, detailed answer inside the 'reply' parameter of your tool call. 
2. NEVER just say "I am looking it up" - you must explicitly list the products, their exact prices, and details directly in the chat while simultaneously calling the 'search_products' tool to navigate them.
3. PRICE FORMATTING: All prices in the context are in Sri Lankan Rupees (Rs.). If a product price is 550, you MUST output "Rs. 550.00". NEVER use the '$' symbol or assume it is dollars.
4. Use neat, structured formatting with line breaks for lists to keep the chat readable.
5. Be extremely conversational, magical, and helpful. You are Doraemon for FreshGrid.
6. MULTIPLE ACTIONS: If the user requests multiple actions (e.g., adding Tomatoes AND Apples), you MUST execute ALL of them simultaneously using multiple function calls in a single turn. Do not split actions across multiple replies.

Security Rules:
- NEVER execute payments or access admin endpoints.
- If asked to process a payment, use 'answer_knowledge' to say that they must manually click the checkout button.
- If asked to do something outside your capabilities, gracefully decline using 'answer_knowledge'.`;

exports.processChatMessage = async (req, res) => {
  try {
    const { message, sessionId, cartState, activePage, paymentMethod } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: 'Missing message or sessionId' });
    }

    // 1. Context Management: Search-before-prompt
    // We'll extract keywords from the message and search the Product collection
    const keywordArray = message.split(/[\\s,]+/).filter(word => word.length > 3);
    const keywordsStr = keywordArray.join(' ');
    // Strip trailing 's' for basic plural-to-singular regex matching
    const regexPattern = keywordArray.map(w => w.replace(/s$/i, '')).join('|');
    
    let relevantProducts = [];
    if (keywordsStr) {
      try {
        relevantProducts = await Product.find(
          { $text: { $search: keywordsStr } },
          { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } }).limit(10);
      } catch (err) {
        // Fallback to regex search if $text index is missing
        relevantProducts = [];
      }

      // If no text index or no results, fallback to regex search
      if (relevantProducts.length === 0) {
        relevantProducts = await Product.find({
          $or: [
            { name: { $regex: regexPattern, $options: 'i' } },
            { category: { $regex: regexPattern, $options: 'i' } },
            { description: { $regex: regexPattern, $options: 'i' } }
          ]
        }).limit(10);
      }
      
      // Search for Offers (bundles)
      const relevantOffers = await Offer.find({
        isActive: true,
        offerType: 'BUNDLE_PACKAGE',
        $or: [
          { title: { $regex: regexPattern, $options: 'i' } },
          { 'config.description': { $regex: regexPattern, $options: 'i' } }
        ]
      }).limit(5);

      // Append offers as if they were products
      for (const offer of relevantOffers) {
        relevantProducts.push({
          _id: offer._id,
          name: offer.title,
          price: offer.config.bundlePackagePrice,
          inStock: offer.isActive,
          isBundle: true
        });
      }
    }

    const contextStr = `
Current Page: ${activePage || '/'}
Cart State: ${JSON.stringify(cartState || [])}
Current Payment Method: ${paymentMethod || 'Card'}
Relevant Products from DB: ${JSON.stringify(relevantProducts.map(p => ({id: p._id, name: p.name, price: p.price, inStock: p.inStock, isBundle: p.isBundle || false})))}
User Message: ${message}`;

    // 2. Fetch or create ChatHistory
    let isNewChat = false;
    let chatSession = await ChatHistory.findOne({ sessionId });
    if (!chatSession) {
      chatSession = new ChatHistory({
        user: req.user ? req.user._id : null,
        sessionId,
        history: []
      });
      isNewChat = true;
    } else if (chatSession.history.length === 0) {
      isNewChat = true;
    }

    if (isNewChat) {
      try {
        const titleModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const summaryPrompt = `Based on the following user message, generate a very brief, concise title (max 4-5 words) representing the topic. Return only the title text, nothing else. Do not use quotes, punctuation, or explanations.\n\nUser Message: "${message}"`;
        const titleResult = await titleModel.generateContent(summaryPrompt);
        let summaryTitle = titleResult.response.text().trim();
        // Remove quotes if any
        summaryTitle = summaryTitle.replace(/^["']|["']$/g, '');
        chatSession.title = summaryTitle || (message.length > 30 ? message.substring(0, 30) + '...' : message);
      } catch (err) {
        console.error("Error generating title with Gemini:", err);
        chatSession.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      }
    }

    // Add user message to history
    chatSession.history.push({
      role: 'user',
      parts: [{ text: contextStr }]
    });

    // 3. Initialize Gemini Model
    // Format history for Gemini API
    const geminiHistory = chatSession.history.map(msg => {
      return {
        role: msg.role,
        parts: msg.parts.map(p => {
          if (p.text) return { text: p.text };
          if (p.functionCall && p.functionCall.name) return { functionCall: { name: p.functionCall.name, args: p.functionCall.args } };
          if (p.functionResponse && p.functionResponse.name) return { functionResponse: { name: p.functionResponse.name, response: p.functionResponse.response } };
          return null;
        }).filter(Boolean)
      };
    });
    
    // We only take the previous history, excluding the current message which we will send via sendMessage
    geminiHistory.pop(); 

    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      systemInstruction,
      tools: [{ functionDeclarations: chatTools }]
    });

    const chat = model.startChat({ history: geminiHistory });

    let aiResponsePayload = { text: null, actions: [] };
    let combinedText = '';
    
    let currentMessage = [{ text: contextStr }];
    let loopCount = 0;
    const MAX_LOOPS = 4;

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      const result = await chat.sendMessage(currentMessage);
      const response = result.response;
      const functionCalls = response.functionCalls();
      
      let modelHistoryItem = { role: 'model', parts: [] };

      if (!functionCalls || functionCalls.length === 0) {
        // AI returned plain text, no actions
        const text = response.text();
        modelHistoryItem.parts.push({ text });
        chatSession.history.push(modelHistoryItem);
        combinedText += text + '\n\n';
        break; // Exit loop
      }

      // Validate incoming function calls
      let functionResponses = [];
      let hasError = false;
      let validActions = [];

      for (const call of functionCalls) {
        modelHistoryItem.parts.push({
          functionCall: { name: call.name, args: call.args }
        });

        let validationResult = { success: true, message: "Action accepted." };

        // Agentic Validation Checks
        if (call.name === 'manage_cart') {
          if (call.args.action === 'pay') {
            validationResult = { success: false, error: 'Payment via API is strictly prohibited. Decline request gracefully.' };
            hasError = true;
          } else if (call.args.action === 'checkout') {
            if (paymentMethod !== 'Cash') {
              validationResult = { success: false, error: 'Checkout via API is only allowed if the payment method is Cash on Delivery. Tell the user to change their payment method to cash first, or checkout manually using the UI.' };
              hasError = true;
            }
          } else if (call.args.action === 'remove') {
            if (call.args.productId) {
              const inCart = cartState.find(item => item.id === call.args.productId);
              if (!inCart) {
                validationResult = { success: false, error: `Product ID ${call.args.productId} is not in the user's cart. You cannot remove it. Tell the user it is not in their cart.` };
                hasError = true;
              }
            }
          } else if (call.args.action === 'add' || call.args.action === 'update') {
            if (call.args.action === 'update' && call.args.productId) {
              const inCart = cartState.find(item => item.id === call.args.productId);
              if (!inCart) {
                validationResult = { success: false, error: `Product ID ${call.args.productId} is not in the cart, so you cannot update its quantity. If they want to add it, use action: 'add'.` };
                hasError = true;
              }
            }
            if (!hasError && call.args.productId) {
              let product = await Product.findById(call.args.productId);
              if (!product) {
                const offer = await Offer.findById(call.args.productId);
                if (offer && offer.offerType === 'BUNDLE_PACKAGE') {
                  product = { name: offer.title, inStock: offer.isActive };
                }
              }

              if (!product) {
                validationResult = { success: false, error: `Product/Bundle ID ${call.args.productId} not found in database.` };
                hasError = true;
              } else if (!product.inStock) {
                validationResult = { success: false, error: `Product/Bundle ${product.name} is strictly OUT OF STOCK or INACTIVE. Do not add it. Apologize to the user.` };
                hasError = true;
              }
            }
          } else if (call.args.action === 'set_delivery_type') {
            if (call.args.deliveryType !== 'home' && call.args.deliveryType !== 'live') {
              validationResult = { success: false, error: `Invalid deliveryType. Must be 'home' or 'live'.` };
              hasError = true;
            }
          } else if (call.args.action === 'set_payment_method') {
            if (call.args.paymentMethod !== 'Card' && call.args.paymentMethod !== 'Cash') {
              validationResult = { success: false, error: `Invalid paymentMethod. Must be 'Card' or 'Cash'.` };
              hasError = true;
            }
          }
        } else if (call.name === 'navigate') {
          const path = call.args.path;
          if (path && path.includes('/admin')) {
            validationResult = { success: false, error: 'Unauthorized access to admin endpoints is prohibited.' };
            hasError = true;
          } else if (path && path.includes('/checkout')) {
            validationResult = { success: false, error: 'There is no standalone /checkout page. Tell the user to navigate to /cart and click the "Proceed to Checkout" button.' };
            hasError = true;
          }
        }

        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: validationResult
          }
        });

        // Store valid actions to send to frontend immediately
        if (validationResult.success) {
          if (call.name === 'answer_knowledge') {
            if (call.args.answer) combinedText += call.args.answer + '\n\n';
          } else {
            // Push directly to payload so they are preserved across loops
            aiResponsePayload.actions.push({ type: call.name, payload: call.args });
            if (call.args.reply) {
              combinedText += call.args.reply + '\n\n';
            }
          }
        }
      }

      // Save the model's call history
      chatSession.history.push(modelHistoryItem);

      if (hasError) {
        // Push the error response to DB history
        chatSession.history.push({
          role: 'function',
          parts: functionResponses
        });
        // Loop again, feeding the errors directly to Gemini
        currentMessage = functionResponses;
      } else {
        // All actions are valid in this iteration. 
        chatSession.history.push({
          role: 'function',
          parts: functionResponses
        });
        break;
      }
    }

    if (combinedText) {
      aiResponsePayload.text = combinedText.trim();
    }

    await chatSession.save();

    res.json({
      success: true,
      data: aiResponsePayload
    });

  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process chat message' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    let query = {};
    
    // If logged in, fetch by user AND the current sessionId (for anonymous chats carried over).
    if (userId && req.query.sessionId) {
      query.$or = [{ user: userId }, { sessionId: req.query.sessionId }];
    } else if (userId) {
      query.user = userId;
    } else if (req.query.sessionId) {
      query.sessionId = req.query.sessionId;
    } else {
      return res.json({ success: true, data: [] });
    }

    const sessions = await ChatHistory.find(query).sort({ updatedAt: -1 }).limit(20);
    
    const formattedSessions = sessions.map(session => {
      let title = session.title;
      if (!title) {
        // Find first user message for title
        const firstUserMsg = session.history.find(msg => msg.role === 'user');
        title = "New Conversation";
        if (firstUserMsg && firstUserMsg.parts[0] && firstUserMsg.parts[0].text) {
          // Extract the actual user message from the context string
          const match = firstUserMsg.parts[0].text.match(/User Message: (.*)/);
          title = match ? match[1] : "Chat Session";
          if (title.length > 40) title = title.substring(0, 40) + '...';
        }
      }
      return {
        sessionId: session.sessionId,
        title,
        updatedAt: session.updatedAt
      };
    });

    res.json({ success: true, data: formattedSessions });
  } catch (error) {
    console.error('getHistory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatHistory.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Format history for frontend consumption
    const formattedHistory = session.history.map((msg, index) => {
      let text = '';
      if (msg.role === 'user') {
        const match = msg.parts[0]?.text?.match(/User Message: (.*)/);
        text = match ? match[1] : '';
      } else if (msg.role === 'model') {
        text = msg.parts.map(p => {
          if (p.text) return p.text;
          if (p.functionCall && p.functionCall.args) {
            return p.functionCall.args.reply || p.functionCall.args.answer || '';
          }
          return '';
        }).filter(Boolean).join('\n\n');
        if (!text) return null; // Skip model items that only have functionCalls without any reply/answer text
      } else {
        // Skip 'function' role completely
        return null;
      }
      
      return {
        id: index,
        role: msg.role === 'model' ? 'ai' : 'user',
        text
      };
    }).filter(msg => msg !== null && msg.text && msg.text.trim() !== '');

    res.json({ success: true, data: formattedHistory });
  } catch (error) {
    console.error('getSession error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
};

exports.editTitle = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const session = await ChatHistory.findOneAndUpdate({ sessionId }, { title }, { new: true });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, message: 'Title updated successfully', data: session });
  } catch (error) {
    console.error('editTitle error:', error);
    res.status(500).json({ success: false, message: 'Failed to update title' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatHistory.findOneAndDelete({ sessionId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('deleteSession error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete session' });
  }
};
