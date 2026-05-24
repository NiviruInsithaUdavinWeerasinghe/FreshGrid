import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

const CATEGORIES = [
  "Vegetables",
  "Fruits",
  "Dairy",
  "Pantry",
  "Bakery",
  "Beverages",
  "Meat & Fish",
];

const UNITS = [
  "kg",
  "g",
  "L",
  "ml",
  "piece",
  "dozen",
  "pack"
];

const emptyProduct = {
  name: "",
  category: "Vegetables",
  unit: "kg",
  weightPerUnit: 1,
  price: "",
  image: "",
  description: "",
  inStock: true,
};

/* ─── Custom Animated Dropdown ─── */
const CategoryDropdown = ({ value, onChange, options, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"
        }`}
      >
        <span>{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : "rotate-0"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel — uses opacity+translate ONLY (no max-height) to avoid layout thrashing */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl animate-slide-up"
        >
          <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  opt === value
                    ? "bg-primary/10 text-primary dark:text-primary-light font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {opt}
                {opt === value && (
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

/* ─── Confirmation Modal ─── */
const ConfirmModal = ({ product, onConfirm, onCancel }) => {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onCancel, 160); // wait for scale-out animation to finish
  };

  const handleConfirm = () => {
    setClosing(true);
    setTimeout(onConfirm, 160);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${closing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className={`relative glass-panel rounded-2xl p-6 w-full max-w-sm shadow-2xl modal-content ${closing ? "animate-scale-out" : "animate-scale-in"}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              Delete Product
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {product?.name}
          </span>
          ?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Product Form Modal ─── */
const ProductModal = ({ product, onSave, onClose }) => {
  const isEditing = !!(product?._id || product?.id);
  const [form, setForm] = useState(product || emptyProduct);
  const [errors, setErrors] = useState({});
  const [closing, setClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectingMetrics, setDetectingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [abortController, setAbortController] = useState(null);

  const handleClose = () => {
    if (saving) return; // don't allow close while uploading
    setClosing(true);
    setTimeout(onClose, 160);
  };

  const handleDetectMetrics = async () => {
    if (!form.name || !form.category) {
      setMetricsError('Name and Category are required for auto-detect.');
      return;
    }
    
    const controller = new AbortController();
    setAbortController(controller);
    setDetectingMetrics(true);
    setMetricsError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/products/estimate-metrics', {
        name: form.name,
        category: form.category,
        description: form.description
      }, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      
      if (res.data.success && res.data.data) {
        setForm(prev => ({
          ...prev,
          unit: res.data.data.unit,
          weightPerUnit: res.data.data.weightPerUnit,
          ...(res.data.data.price ? { price: res.data.data.price } : {})
        }));
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        setMetricsError('Auto-detect stopped.');
      } else {
        setMetricsError('Failed to detect metrics. Try manually.');
      }
    } finally {
      setDetectingMetrics(false);
      setAbortController(null);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Product name is required.";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      e.price = "Enter a valid price.";
    if (!form.image) e.image = "Image is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || saving) return;
    setSaving(true);
    try {
      await onSave({ 
        ...form, 
        price: parseFloat(form.price),
        weightPerUnit: parseFloat(form.weightPerUnit) || 1
      });
      // onSave closes the modal itself — nothing else needed here
    } catch {
      setSaving(false); // re-enable button on error so user can retry
    }
  };

  const previewSrc = form.image
    ? typeof form.image === "string"
      ? form.image
      : URL.createObjectURL(form.image)
    : null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-opacity duration-150 ${closing ? "opacity-0" : "opacity-100"}`}>
      <div className="absolute inset-0 bg-black/70" onClick={handleClose} />
      <div className={`relative w-full max-w-2xl my-4 modal-content ${closing ? "animate-scale-out" : "animate-scale-in"}`}>
        <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

          {/* ── Image Hero Zone ── */}
          <div className="relative flex-shrink-0 h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
            {previewSrc ? (
              <img src={previewSrc} alt="Product preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium">No image selected</p>
              </div>
            )}

            {/* Bottom gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />

            {/* Upload button */}
            <label className="absolute bottom-4 right-4 flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {previewSrc ? "Change Image" : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleChange("image", e.target.files[0])} />
            </label>

            {/* Close button */}
            <button onClick={handleClose} disabled={saving} className="absolute top-4 right-4 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-lg transition-colors disabled:opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Mode badge */}
            <div className="absolute top-4 left-4">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isEditing ? "bg-blue-500/80 text-white" : "bg-primary/80 text-white"}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block" />
                {isEditing ? "Editing Product" : "New Product"}
              </span>
            </div>
          </div>

          {errors.image && (
            <p className="text-xs text-red-500 px-6 pt-2 -mb-2 flex items-center gap-1"><span>⚠</span>{errors.image}</p>
          )}

          {/* ── Form Body ── */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Product Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g. Organic Cherry Tomatoes"
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors.name ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.name}</p>}
            </div>

            {metricsError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{metricsError}</p>}

            {/* Category, Unit, Weight & Price */}
            <div className="flex items-center justify-between mt-2 mb-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">PRODUCT METRICS</span>
              <div className="flex items-center gap-3">
                {detectingMetrics && (
                  <button
                    type="button"
                    onClick={() => { abortController?.abort(); }}
                    className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    ⏹ Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDetectMetrics}
                  disabled={detectingMetrics}
                  className="text-xs font-bold text-primary hover:text-primary-light transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  {detectingMetrics ? (
                    <>
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      Detecting...
                    </>
                  ) : (
                    <>✨ Auto-Detect</>
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Category <span className="text-red-400">*</span>
                </label>
                <CategoryDropdown
                  value={form.category}
                  onChange={(val) => handleChange("category", val)}
                  options={CATEGORIES}
                  error={errors.category}
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Unit <span className="text-red-400">*</span>
                </label>
                <CategoryDropdown
                  value={form.unit || "kg"}
                  onChange={(val) => handleChange("unit", val)}
                  options={UNITS}
                  error={errors.unit}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5" title="Used to calculate delivery fees">
                  Est. Delivery Weight (kg) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.weightPerUnit || 1}
                  onChange={(e) => handleChange("weightPerUnit", e.target.value)}
                  placeholder="1.0"
                  className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors.weightPerUnit ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"}`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                  Price (LKR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400 font-medium text-sm pointer-events-none">Rs.</span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    placeholder="0"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors.price ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"}`}
                  />
                </div>
                {errors.price && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.price}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="A short description of this product..."
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none ${errors.description ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"}`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors.description}</p>}
            </div>

            {/* In Stock Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-gray-100">
                  In Stock
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Is this product currently available for purchase?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStock !== false}
                  onChange={(e) => handleChange("inStock", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/20 rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] px-6 py-3 rounded-xl bg-primary hover:bg-primary-light disabled:bg-primary/70 text-white text-sm font-bold transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isEditing ? "Saving..." : "Uploading..."}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditing ? "Save Changes" : "Add Product"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ─── Category Badge ─── */
const categoryColor = {
  Vegetables:
    "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400",
  Fruits:
    "bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Dairy: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400",
  Pantry:
    "bg-yellow-100 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  Bakery:
    "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Beverages: "bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  "Meat & Fish": "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400",
};

/* ─── Main Products Page ─── */
const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'delete', product }
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data.data);
    } catch (error) {
      showToast("Error fetching products", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (product) => {
    const formData = new FormData();
    formData.append("name", product.name);
    formData.append("category", product.category);
    formData.append("unit", product.unit);
    formData.append("weightPerUnit", product.weightPerUnit);
    formData.append("price", product.price);
    formData.append("description", product.description);
    formData.append("inStock", product.inStock);
    if (product.image instanceof File) {
      formData.append("image", product.image);
    }

    try {
      if (product._id) {
        await axios.put(
          `http://localhost:5000/api/products/${product._id}`,
          formData,
        );
        showToast("Product updated successfully!");
      } else {
        await axios.post("http://localhost:5000/api/products", formData);
        showToast("Product added successfully!");
      }
      await fetchProducts(); // wait for list to refresh before closing
      setModal(null);        // close modal only after everything is done
    } catch (error) {
      showToast("Operation failed", "error");
      throw error; // re-throw so the modal's saving state resets
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/products/${modal.product._id}`,
      );
      showToast("Product deleted.", "error");
      fetchProducts();
    } catch (error) {
      showToast("Delete failed", "error");
    }
    setModal(null);
  };

  const allCategories = [
    "All",
    ...Array.from(new Set(products.map((p) => p.category))),
  ];

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Product Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={() => setModal({ type: "add", product: null })}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white/50 dark:bg-charcoal/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-3">🥦</div>
            <p className="font-semibold text-gray-600 dark:text-gray-300">
              No products found
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                {" "}
                {filtered.map((product) => (
                  <tr
                    key={product._id}
                    className="hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group"
                  >
                  {" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <img
                          src={product.images?.[0] || product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                        />
                        {" "}
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                          {product.name}
                        </span>
                        {" "}
                      </div>
                      {" "}
                    </td>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColor[product.category] || "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}
                      >
                        {product.category}
                        {" "}
                      </span>
                      {" "}
                    </td>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {" "}
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        Rs. {Number(product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        / {product.unit || 'kg'}
                      </span>
                      {" "}
                    </td>
                    {" "}
                    <td className="px-6 py-4 max-w-xs">
                      {" "}
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {product.description}
                      </p>
                      {" "}
                    </td>
                    {" "}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {" "}
                      <div className="flex items-center justify-end gap-2">
                        {" "}
                        <button
                          onClick={() =>
                            setModal({
                              type: "edit",
                              product: {
                                ...product,
                                image: product.images?.[0] || product.image,
                              },
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => setModal({ type: "delete", product })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          Showing{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {filtered.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {products.length}
          </span>{" "}
          products
        </span>
        <span>{allCategories.length - 1} categories</span>
      </div>

      {/* Modals — rendered in a portal so they escape any parent stacking context */}
      {(modal?.type === "add" || modal?.type === "edit") &&
        ReactDOM.createPortal(
          <ProductModal
            product={modal.product}
            onSave={handleSave}
            onClose={() => setModal(null)}
          />,
          document.body
        )}
      {modal?.type === "delete" &&
        ReactDOM.createPortal(
          <ConfirmModal
            product={modal.product}
            onConfirm={handleDelete}
            onCancel={() => setModal(null)}
          />,
          document.body
        )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium transition-all animate-slide-up ${
            toast.type === "error" ? "bg-red-500" : "bg-primary"
          }`}
        >
          {toast.type === "error" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default ProductsManagement;
