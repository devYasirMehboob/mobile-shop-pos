import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  createProduct,
  getProduct,
  productImageUrl,
  updateProduct,
} from "../api/productsApi";
import { getCategories } from "../api/categoriesApi";
import { getUnits } from "../api/unitsApi";
import DreamsProductFormPage from "../components/products/DreamsProductFormPage";
import LoadingState from "../components/LoadingState";
import useAlert from "../hooks/useAlert";
import normalizeApiError from "../utils/normalizeApiError";

const emptyForm = {
  category_id: "",
  name: "",
  product_code: "",
  barcode: "",
  brand: "",
  description: "",
  purchase_cost: "",
  selling_price: "",
  quantity: "0",
  minimum_stock: "5",
  tax: "0",
  discount_type: "fixed",
  discount_value: "0",
  warranty: "1 Year",
  manufacturer: "",
  manufactured_date: "",
  expiry_date: "",
  base_unit_id: "",
  default_purchase_unit_id: "",
  default_sale_unit_id: "",
  stock_mode: "own",
  stock_source_id: "",
  consumption_quantity: "",
  consumption_unit_id: "",
  consumption_quantity_base: "",
  allow_custom_sale: false,
  track_stock: true,
  track_batches: false,
  track_expiry: false,
  status: "active",
  image_data: null,
  remove_image: false,
};

function ProductFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const alert = useAlert();

  const isEdit = Boolean(id);
  const initialBarcode = searchParams.get("barcode") || "";

  const [formValues, setFormValues] = useState({
    ...emptyForm,
    barcode: initialBarcode,
    product_code: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
  });
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    document.title = `${isEdit ? "Edit Product" : "Create Product"} | Dreams POS`;

    async function init() {
      try {
        const [cats, uRes] = await Promise.all([
          getCategories().catch(() => []),
          getUnits().catch(() => ({ units: [] })),
        ]);
        const categoriesList = Array.isArray(cats) ? cats : (cats?.categories || []);
        const unitsList = Array.isArray(uRes) ? uRes : (uRes?.units || []);
        setCategories(categoriesList);
        setUnits(unitsList);

        if (isEdit) {
          const product = await getProduct(id);
          setFormValues({
            ...emptyForm,
            category_id: product.category_id ? String(product.category_id) : "",
            name: product.name || "",
            product_code: product.product_code || "",
            barcode: product.barcode || "",
            brand: product.brand || "",
            description: product.description || "",
            purchase_cost: product.purchase_cost ?? "",
            selling_price: product.selling_price || "",
            quantity: product.quantity ?? "0",
            minimum_stock: product.minimum_stock ?? "5",
            tax: product.tax ?? "0",
            discount_type: product.discount_type || "fixed",
            discount_value: product.discount_value ?? "0",
            warranty: product.warranty || "1 Year",
            manufacturer: product.manufacturer || "",
            manufactured_date: product.manufactured_date || "",
            expiry_date: product.expiry_date || "",
            base_unit_id: product.base_unit_id ? String(product.base_unit_id) : "",
            default_purchase_unit_id: product.default_purchase_unit_id ? String(product.default_purchase_unit_id) : "",
            default_sale_unit_id: product.default_sale_unit_id ? String(product.default_sale_unit_id) : "",
            stock_mode: product.stock_mode || "own",
            stock_source_id: product.stock_source_id ? String(product.stock_source_id) : "",
            consumption_quantity: product.consumption_quantity ?? "",
            consumption_unit_id: product.consumption_unit_id ? String(product.consumption_unit_id) : "",
            consumption_quantity_base: product.consumption_quantity_base ?? "",
            allow_custom_sale: Boolean(Number(product.allow_custom_sale)),
            track_stock: Boolean(Number(product.track_stock)),
            track_batches: Boolean(Number(product.track_batches)),
            track_expiry: Boolean(Number(product.track_expiry)),
            status: product.status || "active",
            image_data: null,
            remove_image: false,
          });
          if (product.image || product.image_url) {
            setImagePreview(productImageUrl(product.image || product.image_url));
          }
        }
      } catch (e) {
        alert.error(normalizeApiError(e).message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [id, isEdit, alert]);

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setFormErrors((current) => ({
        ...current,
        image: "Only JPG, PNG, and WebP images are allowed.",
      }));
      return;
    }

    if (file.size > 2097152) {
      setFormErrors((current) => ({
        ...current,
        image: "The image must not exceed 2 MB.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormValues((current) => ({
        ...current,
        image_data: reader.result,
        remove_image: false,
      }));
      setImagePreview(reader.result);
      setFormErrors((current) => ({ ...current, image: "" }));
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setFormValues((current) => ({
      ...current,
      image_data: null,
      remove_image: true,
    }));
    setImagePreview(null);
  }

  function handleCancel() {
    navigate("/products");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormErrors({});

    let payload = { ...formValues };

    // Auto-generate barcode if left blank by admin
    if (!payload.barcode || !payload.barcode.trim()) {
      payload.barcode = `890${Date.now().toString().slice(-9)}`;
    } else {
      payload.barcode = payload.barcode.trim();
    }

    // Auto-generate SKU / product code if left blank
    if (!payload.product_code || !payload.product_code.trim()) {
      payload.product_code = `SKU-${Math.floor(100000 + Math.random() * 900000)}`;
    } else {
      payload.product_code = payload.product_code.trim();
    }

    const requiredErrors = {};
    if (!payload.name.trim()) requiredErrors.name = "Product name is required.";
    if (!payload.category_id) requiredErrors.category_id = "Select a category.";
    if (!payload.selling_price || Number(payload.selling_price) <= 0)
      requiredErrors.selling_price = "Selling price must be greater than zero.";

    if (Object.keys(requiredErrors).length > 0) {
      setFormErrors(requiredErrors);
      alert.error("Please fill in all required fields highlighted in red.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = isEdit
        ? await updateProduct(id, payload)
        : await createProduct(payload);

      alert.success(response.message || "Product saved successfully.");
      navigate("/products", { replace: true });
    } catch (error) {
      const normalized = normalizeApiError(error);
      setFormErrors(normalized.fieldErrors || {});
      if (Object.keys(normalized.fieldErrors || {}).length === 0) {
        alert.error(normalized.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24">
        <LoadingState label="Loading product specifications..." />
      </div>
    );
  }

  return (
    <DreamsProductFormPage
      values={formValues}
      errors={formErrors}
      isEdit={isEdit}
      categories={categories}
      units={units}
      imagePreview={imagePreview}
      isSubmitting={isSubmitting}
      onChange={handleFormChange}
      onImageChange={handleImageChange}
      onRemoveImage={handleRemoveImage}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}

export default ProductFormPage;
