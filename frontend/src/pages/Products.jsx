import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Box,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useProductData from "@/components/users/hooks/useProductData";

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "0",
};

const sortOptions = [
  { value: "name-asc", label: "Nombre A-Z" },
  { value: "name-desc", label: "Nombre Z-A" },
  { value: "price-desc", label: "Precio mayor" },
  { value: "price-asc", label: "Precio menor" },
  { value: "stock-desc", label: "Stock mayor" },
  { value: "stock-asc", label: "Stock menor" },
];

const badgeCellClassName =
  "inline-flex h-7 min-w-24 justify-center rounded-full px-3 text-center text-xs font-semibold";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const validateProductForm = (form) => {
  const errors = {};

  if (!form.name.trim()) errors.name = "El nombre es requerido";
  if (!form.price) errors.price = "El precio es requerido";
  else if (Number(form.price) <= 0)
    errors.price = "El precio debe ser mayor a 0";

  return errors;
};

function Products() {
  const {
    products,
    loading,
    errorProduct,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useProductData();
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createForm, setCreateForm] = useState(emptyProductForm);
  const [editForm, setEditForm] = useState({ ...emptyProductForm, id: "" });
  const [createErrors, setCreateErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  const rowsPerPage = 10;

  const filteredProducts = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    const matches = products.filter((item) => {
      return (
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term)
      );
    });

    return [...matches].sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name, "es", { sensitivity: "base" });
        case "price-desc":
          return b.price - a.price;
        case "price-asc":
          return a.price - b.price;
        case "stock-desc":
          return b.stock - a.stock;
        case "stock-asc":
          return a.stock - b.stock;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
      }
    });
  }, [products, searchText, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / rowsPerPage)
  );
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredProducts.slice(start, start + rowsPerPage);
  }, [currentPage, filteredProducts]);

  const topCount = products.filter((item) => item.status === "top").length;
  const stableCount = products.filter(
    (item) => item.status === "stable"
  ).length;
  const lowCount = products.filter((item) => item.status === "low").length;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setExpandedRowId(null);
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter, categoryFilter, sortBy]);

  const hasActiveFilters =
    searchText.trim().length > 0 ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    sortBy !== "name-asc";

  const toggleExpandRow = (rowId) => {
    setExpandedRowId((prev) => (prev === rowId ? null : rowId));
  };

  const requestDelete = (product) => {
    setDeleteTarget(product);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    await deleteProduct(deleteTarget.id);
    setExpandedRowId((prev) => (prev === deleteTarget.id ? null : prev));
    setDeleteTarget(null);
  };

  const openEditModal = (product) => {
    setEditForm({
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    const errors = validateProductForm(createForm);
    setCreateErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // Reemplaza el payload en handleCreateSubmit
    const payload = {
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      price: Number(createForm.price),
      stock: Number(createForm.stock) || 0,
    };

    const created = await createProduct(payload);
    if (created) {
      setCreateForm(emptyProductForm);
      setCreateErrors({});
      setIsCreateOpen(false);
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    const errors = validateProductForm(editForm);
    setEditErrors(errors);

    if (Object.keys(errors).length > 0) return;

    // Reemplaza el payload en handleEditSubmit
    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      price: Number(editForm.price),
      stock: Number(editForm.stock) || 0,
    };

    const updated = await updateProduct(payload, editForm.id);
    if (updated) {
      setIsEditOpen(false);
      setEditErrors({});
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pb-3">
      <div className="space-y-3 rounded-[28px] border border-white/8 bg-black/20 px-4 py-4 shadow-[0_16px_45px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_230px_auto]">
          <InputGroup className="h-10 rounded-full border-white/15 bg-black/25 text-white shadow-none">
            <InputGroupAddon className="pl-4 text-white/35">
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar por nombre, descripción o ID..."
              className="h-10 rounded-full border-0 bg-transparent text-white placeholder:text-white/35"
              aria-label="Buscar productos"
            />
          </InputGroup>

          <Combobox
            value={sortBy}
            onValueChange={setSortBy}
            options={sortOptions}
            placeholder="Ordenar por"
            searchPlaceholder="Buscar orden..."
            icon={<ArrowUpDown className="h-4 w-4" />}
          />

          <Button
            variant="outline"
            className="h-10 rounded-full border-[#822727]/70 bg-transparent px-4 text-sm font-semibold text-white hover:bg-[#822727]/15 hover:text-white"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-b border-white/10 pb-2">
          <div className="ml-auto text-xs text-white/45">{filteredProducts.length} resultados</div>

          {searchText.trim().length > 0 || sortBy !== "name-asc" ? (
            <Button
              type="button"
              variant="ghost"
              className="h-8 rounded-full px-3 text-white/60 hover:bg-white/10 hover:text-white"
              onClick={() => {
                setSearchText("");
                setSortBy("name-asc");
              }}
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="min-h-0 flex-1 border-white/10 bg-[#111111]/90 text-white shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-sm">
        <CardContent className="flex min-h-0 flex-1 flex-col pt-3">
          {errorProduct ? (
            <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {errorProduct}
            </div>
          ) : null}

          <div className="scrollbar-invisible min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-[#151515]">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#151515]">
                <TableRow className="border-white/10 bg-[#151515] hover:bg-[#151515]">
                  <TableHead className="w-12 text-white/45">
                    <Checkbox aria-label="Seleccionar todos" />
                  </TableHead>
                  <TableHead className="text-white/45">ID No.</TableHead>
                  <TableHead className="text-white/45">Producto</TableHead>
                  <TableHead className="text-white/45">Descripción</TableHead>
                  <TableHead className="text-white/45">Precio</TableHead>
                  <TableHead className="text-white/45">Stock</TableHead>
                  <TableHead className="w-32 text-right text-white/45">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 6 }, (_, index) => (
                      <TableRow key={`loading-row-${index}`} className="border-white/10">
                        <TableCell><Skeleton className="h-4 w-4 rounded-sm bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12 bg-white/10" /></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1.5">
                            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
                            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
                            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : null}

                {!loading && paginatedProducts.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={7} className="py-8 text-center text-white/55">
                      No hay productos para mostrar.
                    </TableCell>
                  </TableRow>
                ) : null}

                {paginatedProducts.map((item, index) => {
                  const cardinalId = (currentPage - 1) * rowsPerPage + index + 1;

                  return (
                    <Fragment key={`${item.id}-group`}>
                      <TableRow className={`border-white/10 hover:bg-white/4 ${expandedRowId === item.id ? "bg-white/4" : ""}`}>
                        <TableCell>
                          <Checkbox aria-label={`Seleccionar ${item.name}`} />
                        </TableCell>
                        <TableCell className="text-white/65">{cardinalId}</TableCell>
                        <TableCell className="font-medium text-white">
                          <span className="inline-flex items-center gap-2">
                            <Box className="h-4 w-4 text-[#822727]" />
                            {item.name}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-white/65">
                          {item.description || "—"}
                        </TableCell>
                        <TableCell className="text-white/65">{formatPrice(item.price)}</TableCell>
                        <TableCell className="text-white/65">{item.stock}</TableCell>
                        <TableCell className="w-32 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-md border border-white/15 bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                              onClick={() => toggleExpandRow(item.id)}
                            >
                              {expandedRowId === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-md border border-white/15 bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                              onClick={() => openEditModal(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-md border border-[#822727]/35 bg-[#822727]/10 text-[#ff8f8f] hover:bg-[#822727]/20 hover:text-[#ffb6b6]"
                              onClick={() => requestDelete(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedRowId === item.id ? (
                        <TableRow className="border-white/10 bg-white/4">
                          <TableCell colSpan={7}>
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-white/40">Stock</p>
                                <p className="mt-1 text-sm text-white">{item.stock}</p>
                              </div>
                              <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-white/40">Descripción completa</p>
                                <p className="mt-1 text-sm text-white">{item.description || "Sin descripción"}</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
            <p className="text-xs text-white/55">
              {filteredProducts.length === 0
                ? "Mostrando 0 de 0"
                : `Mostrando ${(currentPage - 1) * rowsPerPage + 1}-${Math.min(currentPage * rowsPerPage, filteredProducts.length)} de ${filteredProducts.length}`}
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/15 bg-transparent px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </Button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant="outline"
                  className={`h-9 min-w-9 rounded-full border px-3 text-sm ${
                    currentPage === page
                      ? "border-[#822727] bg-[#822727] text-white hover:bg-[#9b2f2f]"
                      : "border-white/15 bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-full border-white/15 bg-transparent px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODAL CREAR */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="border border-white/10 bg-[#161616] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
            <DialogDescription className="text-white/55">Completa el formulario para agregar un nuevo producto.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Nombre</Label>
              <Input
                id="create-name"
                className="h-11"
                autoComplete="off"
                value={createForm.name}
                onChange={(event) => {
                  setCreateForm((prev) => ({ ...prev, name: event.target.value }));
                  if (createErrors.name) setCreateErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Ej. Laptop X14"
                aria-invalid={!!createErrors.name}
              />
              {createErrors.name && <p className="text-xs text-red-500">{createErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-description">Descripción</Label>
              <Input
                id="create-description"
                className="h-11"
                autoComplete="off"
                value={createForm.description}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Descripción opcional"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-price">Precio (USD)</Label>
                <Input
                  id="create-price"
                  className="h-11"
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.price}
                  onChange={(event) => {
                    setCreateForm((prev) => ({ ...prev, price: event.target.value }));
                    if (createErrors.price) setCreateErrors((prev) => ({ ...prev, price: "" }));
                  }}
                  placeholder="0.00"
                  aria-invalid={!!createErrors.price}
                />
                {createErrors.price && <p className="text-xs text-red-500">{createErrors.price}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-stock">Stock</Label>
                <Input
                  id="create-stock"
                  className="h-11"
                  type="number"
                  min="0"
                  value={createForm.stock}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, stock: event.target.value }))}
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" className="h-11 px-5 text-black" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="h-11 bg-[#822727] px-5 text-base hover:bg-[#9b2f2f]">
                {loading ? "Guardando..." : "Guardar producto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="border border-white/10 bg-[#161616] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription className="text-white/55">Actualiza la información del producto y guarda para aplicar cambios.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                className="h-11"
                autoComplete="off"
                value={editForm.name}
                onChange={(event) => {
                  setEditForm((prev) => ({ ...prev, name: event.target.value }));
                  if (editErrors.name) setEditErrors((prev) => ({ ...prev, name: "" }));
                }}
                aria-invalid={!!editErrors.name}
              />
              {editErrors.name && <p className="text-xs text-red-500">{editErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Descripción</Label>
              <Input
                id="edit-description"
                className="h-11"
                autoComplete="off"
                value={editForm.description}
                onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-price">Precio (USD)</Label>
                <Input
                  id="edit-price"
                  className="h-11"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.price}
                  onChange={(event) => {
                    setEditForm((prev) => ({ ...prev, price: event.target.value }));
                    if (editErrors.price) setEditErrors((prev) => ({ ...prev, price: "" }));
                  }}
                  aria-invalid={!!editErrors.price}
                />
                {editErrors.price && <p className="text-xs text-red-500">{editErrors.price}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  className="h-11"
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, stock: event.target.value }))}
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" className="h-11 px-5 text-black" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading} className="h-11 bg-[#822727] px-5 text-base hover:bg-[#9b2f2f]">
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT ELIMINAR */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => (!open ? setDeleteTarget(null) : null)}>
        <AlertDialogContent className="border border-white/10 bg-[#161616] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription className="text-white/55">
              {`¿Estás seguro de eliminar ${deleteTarget?.name ?? "este producto"}? Esta acción no se puede deshacer.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="bg-transparent border-t-0">
            <AlertDialogCancel variant="outline" className="text-black hover:text-black">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-[#822727] hover:bg-[#9b2f2f]" onClick={confirmDelete}>
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Products;
