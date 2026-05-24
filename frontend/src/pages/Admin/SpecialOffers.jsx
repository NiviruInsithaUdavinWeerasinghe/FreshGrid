import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactDOM from 'react-dom';

  const emptyOffer = {
    title: '',
    offerType: 'BUNDLE_PACKAGE',
    validFrom: '',
    validTo: '',
    isActive: true,
    showBanner: false,
    config: {
      minCartValue: '',
      minCartWeightKg: '',
      discountedWeightRate: '',
      waiveBaseFee: false,
      targetProductId: '',
      minQuantity: '',
      discountedUnitPrice: '',
      bundleProducts: [],
      bundlePackagePrice: ''
    }
  };

  /* ─── Custom Animated Dropdown ─── */
  const CustomDropdown = ({ value, onChange, options, error }) => {
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);

    // Close on outside click
    useEffect(() => {
      const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
            error ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"
          }`}
        >
          <span>{selectedOption?.label}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl animate-slide-up">
            <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    opt.value === value
                      ? "bg-primary/10 text-primary dark:text-primary-light font-semibold"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                  {opt.value === value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const OfferModal = ({ offer, offers, onSave, onClose, products }) => {
    const isEditing = !!offer?._id;
    const [form, setForm] = useState(
      offer
        ? {
            ...offer,
            validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().slice(0, 16) : '',
            validTo: offer.validTo ? new Date(offer.validTo).toISOString().slice(0, 16) : ''
          }
        : emptyOffer
    );
    const [saving, setSaving] = useState(false);
    const [closing, setClosing] = useState(false);
    const [formError, setFormError] = useState('');
    const scrollRef = React.useRef(null);

    const activeBannerOffer = (offers || []).find(o => o.showBanner && o.isActive && o._id !== form._id);
    const isBannerDisabled = !!activeBannerOffer;

    const handleClose = () => {
      setClosing(true);
      setTimeout(onClose, 160);
    };

    const handleChange = (field, value) => {
      setFormError('');
      setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleConfigChange = (field, value) => {
      setFormError('');
      setForm(prev => ({
        ...prev,
        config: { ...prev.config, [field]: value }
      }));
    };

    const handleAddBundleItem = () => {
      const newBundle = [...(form.config.bundleProducts || []), { productId: '', quantity: 1 }];
      handleConfigChange('bundleProducts', newBundle);
    };

    const handleUpdateBundleItem = (index, field, value) => {
      const newBundle = [...form.config.bundleProducts];
      newBundle[index][field] = value;
      handleConfigChange('bundleProducts', newBundle);
    };

    const handleRemoveBundleItem = (index) => {
      const newBundle = form.config.bundleProducts.filter((_, i) => i !== index);
      handleConfigChange('bundleProducts', newBundle);
    };

    const validateForm = () => {
      if (form.offerType === 'MULTI_BUY') {
        const sp = products.find(p => p._id === form.config.targetProductId);
        if (!sp) return "Please select a target product.";
        const discPrice = Number(form.config.discountedUnitPrice);
        if (discPrice >= Number(sp.price)) {
          return "Discounted price must be strictly lower than the original price.";
        }
        if (discPrice <= 0) {
          return "Discounted price must be greater than 0.";
        }
      }
      return null;
    };

    const smoothScrollToTop = (element, duration = 500) => {
      const start = element.scrollTop;
      const startTime = performance.now();

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (easeInOutCubic) for a very smooth start and end
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        element.scrollTop = start * (1 - ease);

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      const error = validateForm();
      if (error) {
        setFormError(error);
        if (scrollRef.current) {
          smoothScrollToTop(scrollRef.current, 600); // 600ms for a deliberately smooth, noticeable scroll
        }
        return;
      }

      setSaving(true);
      try {
        const payload = { ...form };
        // cleanup empty strings
        Object.keys(payload.config).forEach(key => {
          if (payload.config[key] === '') payload.config[key] = null;
        });

        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('offerType', payload.offerType);
        formData.append('validFrom', payload.validFrom);
        formData.append('validTo', payload.validTo);
        formData.append('isActive', payload.isActive);
        formData.append('showBanner', payload.showBanner);
        formData.append('config', JSON.stringify(payload.config));
      
      if (payload.imageFile instanceof File) {
        formData.append('image', payload.imageFile);
      }

      await onSave(formData, payload._id);
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  const previewSrc = form.imageFile
    ? URL.createObjectURL(form.imageFile)
    : form.config.image;

  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-150 ${closing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className={`relative w-full max-w-3xl my-4 modal-content ${closing ? "animate-scale-out" : "animate-scale-in"}`}>
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
            </h2>
            <button onClick={handleClose} className="p-2 bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 rounded-full transition-colors text-gray-600 dark:text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form ref={scrollRef} onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
            
            {formError && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-semibold">
                {formError}
              </div>
            )}
            
            {/* Step 1: General Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">1. General Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Offer Title *</label>
                  <input type="text" required value={form.title} onChange={e => handleChange('title', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. Weekend Delivery Subsidy" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Valid From *</label>
                  <input type="datetime-local" required value={form.validFrom} onChange={e => handleChange('validFrom', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white dark:[color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Valid To *</label>
                  <input type="datetime-local" required value={form.validTo} onChange={e => handleChange('validTo', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none dark:text-white dark:[color-scheme:dark]" />
                </div>
                <div className="md:col-span-2 mt-2">
                  <label className={`relative inline-flex items-center gap-3 ${isBannerDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`} title={isBannerDisabled ? `Banner is already in use by: ${activeBannerOffer.title}` : ''}>
                    <input type="checkbox" checked={form.showBanner} disabled={isBannerDisabled} onChange={e => handleChange('showBanner', e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary shadow-inner"></div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Show Promotional Banner on Storefront</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-14">
                    {isBannerDisabled 
                      ? `Currently in use by: ${activeBannerOffer.title}. Only one banner can be active at a time.` 
                      : `Display a global banner highlighting this offer to all users.`}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* Step 2: Offer Type */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">2. Promotion Type</h3>
              <div>
                <CustomDropdown
                  value={form.offerType}
                  onChange={(val) => handleChange('offerType', val)}
                  options={[
                    { value: "BUNDLE_PACKAGE", label: "Bundle Package" },
                    { value: "DELIVERY_SUBSIDY_OR_WEIGHT", label: "Delivery Subsidy / Weight Discount" },
                    { value: "MULTI_BUY", label: "Multi-Buy Discount" }
                  ]}
                />
              </div>
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* Step 3: Conditional Config */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">3. Configuration Details</h3>
              
              {form.offerType === 'DELIVERY_SUBSIDY_OR_WEIGHT' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Min Cart Value (LKR)</label>
                    <input type="number" value={form.config.minCartValue || ''} onChange={e => handleConfigChange('minCartValue', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 5000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Min Cart Weight (kg)</label>
                    <input type="number" value={form.config.minCartWeightKg || ''} onChange={e => handleConfigChange('minCartWeightKg', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Discounted Weight Rate (LKR/kg)</label>
                    <input 
                  type="number" 
                  value={form.config.discountedWeightRate || ''} 
                  onChange={e => handleConfigChange('discountedWeightRate', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. 5 (Default is 30)" 
                />
                  </div>
                  <div className="flex items-center mt-6">
                    <label className="relative inline-flex items-center cursor-pointer gap-3">
                      <input type="checkbox" checked={form.config.waiveBaseFee} onChange={e => handleConfigChange('waiveBaseFee', e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Waive Base Delivery Fee</span>
                    </label>
                  </div>
                </div>
              )}

              {form.offerType === 'MULTI_BUY' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Target Product *</label>
                    <CustomDropdown
                      value={form.config.targetProductId || ''}
                      onChange={val => handleConfigChange('targetProductId', val)}
                      options={[
                        { value: "", label: "Select a Product" },
                        ...sortedProducts.map(p => ({ value: p._id, label: p.name }))
                      ]}
                      error={!form.config.targetProductId}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Minimum Quantity *
                      {form.config.targetProductId && (
                        <span className="ml-1 text-primary font-bold lowercase bg-primary/10 px-1.5 py-0.5 rounded">
                          ({products.find(p => p._id === form.config.targetProductId)?.unit || 'units'})
                        </span>
                      )}
                    </label>
                    <input required type="number" value={form.config.minQuantity || ''} onChange={e => handleConfigChange('minQuantity', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 3" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">
                      Discounted Unit Price (LKR) *
                      {form.config.targetProductId && (
                        <span className="ml-2 text-primary font-bold lowercase bg-primary/10 px-1.5 py-0.5 rounded">
                          (Original: Rs. {products.find(p => p._id === form.config.targetProductId)?.price})
                        </span>
                      )}
                    </label>
                    <input required type="number" value={form.config.discountedUnitPrice || ''} onChange={e => handleConfigChange('discountedUnitPrice', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 1500" />
                  </div>
                </div>
              )}

              {form.offerType === 'BUNDLE_PACKAGE' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Flat Bundle Price (LKR) *</label>
                    <input required type="number" value={form.config.bundlePackagePrice || ''} onChange={e => handleConfigChange('bundlePackagePrice', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="e.g. 6000" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Bundle Products *</label>
                    <div className="space-y-3 mb-3">
                      {(form.config.bundleProducts || []).map((bp, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1">
                            <CustomDropdown
                              value={bp.productId}
                              onChange={val => handleUpdateBundleItem(i, 'productId', val)}
                              options={[
                                { value: "", label: "Select Product" },
                                ...sortedProducts
                                  .filter(p => p._id === bp.productId || !(form.config.bundleProducts || []).some((otherBp, index) => index !== i && otherBp.productId === p._id))
                                  .map(p => ({ value: p._id, label: p.name }))
                              ]}
                              error={!bp.productId}
                            />
                          </div>
                          <input required type="number" min="1" value={bp.quantity} onChange={e => handleUpdateBundleItem(i, 'quantity', e.target.value)} className="w-24 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Qty" />
                          <button type="button" onClick={() => handleRemoveBundleItem(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={handleAddBundleItem} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-sm rounded-xl transition-colors">
                      + Add Product to Package
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Bundle Display Image</label>
                    <div className="flex items-center gap-4">
                      {previewSrc ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/10 group">
                          <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <label className="cursor-pointer text-white text-xs font-bold px-2 py-1 bg-primary rounded-lg">
                              Change
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleChange("imageFile", e.target.files[0])} />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      
                      {!previewSrc && (
                        <label className="cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                          Upload Image
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleChange("imageFile", e.target.files[0])} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">Bundle Description</label>
                    <textarea rows="2" value={form.config.description || ''} onChange={e => handleConfigChange('description', e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="A great pack for..." />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
              <button type="button" onClick={handleClose} disabled={saving} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-semibold transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-[2] px-6 py-3 rounded-xl bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/25">
                {saving ? 'Saving...' : 'Save Promotion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SpecialOffers = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null); // 'add' | 'edit'
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [resOffers, resProducts] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/offers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/products')
      ]);
      setOffers(resOffers.data.data);
      setProducts(resProducts.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (formData, id) => {
    const token = localStorage.getItem('token');
    if (id) {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/offers/${id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/offers', formData, { headers: { Authorization: `Bearer ${token}` } });
    }
    await fetchData();
    setModal(null);
  };

  const handleToggleActive = async (offer) => {
    const token = localStorage.getItem('token');
    await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/offers/${offer._id}`, { isActive: !offer.isActive }, { headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/offers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setConfirmDelete(null);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase">Loading Data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Special Offers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage promotions, bundles, and delivery subsidies.</p>
        </div>
        <button onClick={() => setModal('add')} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-light shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create Offer
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title & Type</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Validity</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {offers.map(offer => {
              const isActiveNow = new Date() >= new Date(offer.validFrom) && new Date() <= new Date(offer.validTo);
              return (
                <tr key={offer._id} className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{offer.title}</div>
                    <div className="text-xs font-medium text-primary mt-0.5">{offer.offerType.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600 dark:text-gray-300">From: {new Date(offer.validFrom).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">To: {new Date(offer.validTo).toLocaleDateString()}</div>
                    {isActiveNow && offer.isActive && <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-bold rounded-md">CURRENTLY ACTIVE</span>}
                  </td>
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={offer.isActive} onChange={() => handleToggleActive(offer)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {confirmDelete === offer._id ? (
                      <div className="flex items-center justify-end gap-2 animate-slide-up">
                        <button onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg transition-colors">Cancel</button>
                        <button onClick={() => handleDelete(offer._id)} className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm shadow-red-500/20">Confirm Delete</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setModal(offer)} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors">Edit</button>
                        <button onClick={() => setConfirmDelete(offer._id)} className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {offers.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">No special offers found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && ReactDOM.createPortal(
        <OfferModal 
          offer={modal === 'add' ? null : modal} 
          offers={offers}
          onSave={handleSave} 
          onClose={() => setModal(null)} 
          products={products}
        />,
        document.body
      )}
    </div>
  );
};

export default SpecialOffers;
