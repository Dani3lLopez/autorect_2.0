// src/components/products/hooks/useProductData.js
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const useProductData = () => {
  const API_BASE = "http://localhost:3000/api";
  const API_PRODUCTS = `${API_BASE}/products`;
  const TOKEN_KEY = "accessToken";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorProduct, setError] = useState(null);
  const { logout } = useAuth();
  const authExpiredHandledRef = useRef(false);

  const handleUnauthorized = useCallback(async () => {
    if (authExpiredHandledRef.current) return;
    authExpiredHandledRef.current = true;
    await logout({ reason: "expired", callApi: false });
  }, [logout]);

  const getAccessToken = () =>
    localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);

  const buildHeaders = (withBody = false) => {
    const token = getAccessToken();
    return {
      ...(withBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const extractApiPayload = (payload = {}) => ({
    data: payload?.data ?? null,
    message: payload?.message || "",
    errors: payload?.meta?.errors || [],
  });

  // Ajusta los campos según lo que devuelva TU backend
  const normalizeProduct = (p = {}) => ({
    id: p._id || p.id || "",
    name: p.name || "",
    description: p.description || "",
    price: Number(p.price?.$numberDecimal ?? p.price) || 0,
    stock: Number(p.stock) || 0,
  });

  // GET /api/products
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAccessToken();
      if (!token) { await handleUnauthorized(); return; }

      const response = await fetch(API_PRODUCTS, {
        method: "GET",
        headers: buildHeaders(),
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      const { data, message } = extractApiPayload(payload);

      if (!response.ok) {
        if (response.status === 401) { await handleUnauthorized(); return; }
        throw new Error(message || "Error al obtener los productos");
      }

      setProducts(Array.isArray(data) ? data.map(normalizeProduct) : []);
    } catch (error) {
      setProducts([]);
      setError(error.message);
      toast.error(error.message || "Error al obtener los productos");
    } finally {
      setLoading(false);
    }
  };

  // POST /api/products
  const createProduct = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_PRODUCTS, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      const { message, errors } = extractApiPayload(payload);

      if (!response.ok) {
        if (response.status === 401) { await handleUnauthorized(); return false; }
        const backendErrors = errors.length > 0 ? `: ${errors.join(", ")}` : "";
        throw new Error((message || "Error al crear el producto") + backendErrors);
      }

      toast.success(message || "Producto creado exitosamente");
      await fetchData();
      return true;
    } catch (error) {
      setError(error.message);
      toast.error(error.message || "Error al crear el producto");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // PUT /api/products/:id
  const updateProduct = async (formData, productId) => {
    if (!productId) {
      toast.error("No se encontró el producto a actualizar");
      return false;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_PRODUCTS}/${productId}`, {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      const { message, errors } = extractApiPayload(payload);

      if (!response.ok) {
        if (response.status === 401) { await handleUnauthorized(); return false; }
        const backendErrors = errors.length > 0 ? `: ${errors.join(", ")}` : "";
        throw new Error((message || "Error al actualizar el producto") + backendErrors);
      }

      toast.success(message || "Producto actualizado exitosamente");
      await fetchData();
      return true;
    } catch (error) {
      setError(error.message);
      toast.error(error.message || "Error al actualizar el producto");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // DELETE /api/products/:id
  const deleteProduct = async (productId) => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_PRODUCTS}/${productId}`, {
        method: "DELETE",
        headers: buildHeaders(),
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));
      const { message } = extractApiPayload(payload);

      if (!response.ok) {
        if (response.status === 401) { await handleUnauthorized(); return; }
        throw new Error(message || "Error al eliminar el producto");
      }

      toast.success(message || "Producto eliminado exitosamente");
      await fetchData();
    } catch (error) {
      setError(error.message);
      toast.error(error.message || "Error al eliminar el producto");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return { products, loading, errorProduct, fetchData, createProduct, updateProduct, deleteProduct };
};

export default useProductData;