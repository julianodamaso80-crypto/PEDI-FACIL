"use client"

import { useState, useCallback } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { z } from "zod"
import { cn, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ImageIcon,
  Star,
  X,
  Loader2,
  UtensilsCrossed,
  Tag,
} from "lucide-react"

// ==================== TYPES ====================

interface Category {
  id: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
  _count: { items: number }
}

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  isAvailable: boolean
  isPopular: boolean
  sortOrder: number
  extras: { name: string; price: number }[] | null
  sizes: { name: string; price: number }[] | null
  categoryId: string
  category: { id: string; name: string }
}

interface MenuPanelProps {
  restaurantId: string
  initialCategories: Category[]
  initialItems: MenuItem[]
}

// ==================== SCHEMAS ====================

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

const sizeExtraSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  price: z.coerce.number().min(0, "Preço deve ser >= 0"),
})

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que 0"),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  image: z.string().optional(),
  isAvailable: z.boolean(),
  isPopular: z.boolean(),
  sizes: z.array(sizeExtraSchema),
  extras: z.array(sizeExtraSchema),
})

type ItemFormData = z.infer<typeof itemSchema>

// ==================== COMPONENT ====================

export function MenuPanel({
  restaurantId,
  initialCategories,
  initialItems,
}: MenuPanelProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [activeTab, setActiveTab] = useState("categories")

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryLoading, setCategoryLoading] = useState(false)

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemLoading, setItemLoading] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "item"
    id: string
    name: string
  } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Filter state for items tab
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all")

  // ==================== CATEGORY ACTIONS ====================

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = async (data: CategoryFormData) => {
    setCategoryLoading(true)
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
        const updated = await res.json()
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        )
      } else {
        const maxSort = categories.reduce(
          (max, c) => Math.max(max, c.sortOrder),
          -1
        )
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            restaurantId,
            sortOrder: maxSort + 1,
          }),
        })
        const created = await res.json()
        setCategories((prev) => [...prev, created])
      }
      setCategoryDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
    } finally {
      setCategoryLoading(false)
    }
  }

  const toggleCategoryActive = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      })
      const updated = await res.json()
      setCategories((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      )
    } catch (error) {
      console.error("Erro ao alternar categoria:", error)
    }
  }

  const moveCategoryOrder = async (
    category: Category,
    direction: "up" | "down"
  ) => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((c) => c.id === category.id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return

    const other = sorted[swapIdx]
    try {
      await Promise.all([
        fetch(`/api/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: other.sortOrder }),
        }),
        fetch(`/api/categories/${other.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: category.sortOrder }),
        }),
      ])

      setCategories((prev) =>
        prev
          .map((c) => {
            if (c.id === category.id)
              return { ...c, sortOrder: other.sortOrder }
            if (c.id === other.id)
              return { ...c, sortOrder: category.sortOrder }
            return c
          })
          .sort((a, b) => a.sortOrder - b.sortOrder)
      )
    } catch (error) {
      console.error("Erro ao reordenar:", error)
    }
  }

  // ==================== ITEM ACTIONS ====================

  const openCreateItem = () => {
    setEditingItem(null)
    setItemDialogOpen(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemDialogOpen(true)
  }

  const handleSaveItem = async (data: ItemFormData) => {
    setItemLoading(true)
    try {
      const payload = {
        ...data,
        extras: data.extras.length > 0 ? data.extras : null,
        sizes: data.sizes.length > 0 ? data.sizes : null,
      }

      if (editingItem) {
        const res = await fetch(`/api/menu-items/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const updated = await res.json()
        setItems((prev) =>
          prev.map((i) => (i.id === updated.id ? updated : i))
        )
      } else {
        const res = await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, restaurantId }),
        })
        const created = await res.json()
        setItems((prev) => [...prev, created])
      }
      setItemDialogOpen(false)
    } catch (error) {
      console.error("Erro ao salvar item:", error)
    } finally {
      setItemLoading(false)
    }
  }

  const toggleItemAvailability = useCallback(async (item: MenuItem) => {
    try {
      const res = await fetch(`/api/menu-items/${item.id}/toggle`, {
        method: "POST",
      })
      const updated = await res.json()
      setItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      )
    } catch (error) {
      console.error("Erro ao alternar disponibilidade:", error)
    }
  }, [])

  // ==================== DELETE ====================

  const openDeleteDialog = (
    type: "category" | "item",
    id: string,
    name: string
  ) => {
    setDeleteTarget({ type, id, name })
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      const url =
        deleteTarget.type === "category"
          ? `/api/categories/${deleteTarget.id}`
          : `/api/menu-items/${deleteTarget.id}`

      await fetch(url, { method: "DELETE" })

      if (deleteTarget.type === "category") {
        setCategories((prev) =>
          prev.filter((c) => c.id !== deleteTarget.id)
        )
        setItems((prev) =>
          prev.filter((i) => i.categoryId !== deleteTarget.id)
        )
      } else {
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id))
      }
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("Erro ao deletar:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  // ==================== FILTERED ITEMS ====================

  const filteredItems =
    filterCategoryId === "all"
      ? items
      : items.filter((i) => i.categoryId === filterCategoryId)

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cardápio</h1>
          <p className="text-sm text-gray-400">
            Gerencie as categorias e itens do seu cardápio
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800 border border-gray-700">
          <TabsTrigger
            value="categories"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
          >
            <Tag className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger
            value="items"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
          >
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Itens
          </TabsTrigger>
        </TabsList>

        {/* ==================== CATEGORIES TAB ==================== */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openCreateCategory}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700 p-8">
              <div className="text-center text-gray-400">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">
                  Nenhuma categoria criada
                </p>
                <p className="text-sm mt-1">
                  Crie categorias para organizar seu cardápio
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {categories
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((category, idx) => (
                  <Card
                    key={category.id}
                    className="bg-gray-800/50 border-gray-700 p-4"
                  >
                    <div className="flex items-center gap-4">
                      {/* Sort controls */}
                      <div className="flex flex-col items-center gap-0.5">
                        <GripVertical className="h-4 w-4 text-gray-600" />
                        <button
                          onClick={() =>
                            moveCategoryOrder(category, "up")
                          }
                          disabled={idx === 0}
                          className="p-0.5 rounded hover:bg-gray-700 disabled:opacity-30 text-gray-400"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            moveCategoryOrder(category, "down")
                          }
                          disabled={idx === categories.length - 1}
                          className="p-0.5 rounded hover:bg-gray-700 disabled:opacity-30 text-gray-400"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
                            {category.name}
                          </h3>
                          <Badge
                            variant={
                              category.isActive ? "default" : "secondary"
                            }
                            className={cn(
                              "text-xs",
                              category.isActive
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                            )}
                          >
                            {category.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-400 truncate mt-0.5">
                            {category.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {category._count.items}{" "}
                          {category._count.items === 1 ? "item" : "itens"}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() =>
                            toggleCategoryActive(category)
                          }
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditCategory(category)}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openDeleteDialog(
                              "category",
                              category.id,
                              category.name
                            )
                          }
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

        {/* ==================== ITEMS TAB ==================== */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Select
              value={filterCategoryId}
              onValueChange={setFilterCategoryId}
            >
              <SelectTrigger className="w-[220px] bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem
                  value="all"
                  className="text-gray-300 focus:bg-gray-700 focus:text-white"
                >
                  Todas as categorias
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-gray-300 focus:bg-gray-700 focus:text-white"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={openCreateItem}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>

          {categories.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700 p-8">
              <div className="text-center text-gray-400">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">
                  Crie uma categoria primeiro
                </p>
                <p className="text-sm mt-1">
                  Você precisa de pelo menos uma categoria para adicionar itens
                </p>
              </div>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="bg-gray-800/50 border-gray-700 p-8">
              <div className="text-center text-gray-400">
                <UtensilsCrossed className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">Nenhum item encontrado</p>
                <p className="text-sm mt-1">
                  Adicione itens ao seu cardápio
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className="bg-gray-800/50 border-gray-700 overflow-hidden"
                >
                  {/* Image */}
                  <div className="h-36 bg-gray-700/50 flex items-center justify-center relative">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-10 w-10 text-gray-600" />
                    )}
                    {item.isPopular && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500/90 text-yellow-950 text-xs">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Popular
                      </Badge>
                    )}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
                        <Badge className="bg-red-500/90 text-white text-xs">
                          Indisponível
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-white truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-400">
                        {formatCurrency(item.price)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-400 border-gray-600"
                      >
                        {item.category.name}
                      </Badge>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`avail-${item.id}`}
                          className="text-xs text-gray-400"
                        >
                          Disponível
                        </Label>
                        <Switch
                          id={`avail-${item.id}`}
                          checked={item.isAvailable}
                          onCheckedChange={() =>
                            toggleItemAvailability(item)
                          }
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditItem(item)}
                          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            openDeleteDialog("item", item.id, item.name)
                          }
                          className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ==================== CATEGORY FORM DIALOG ==================== */}
      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
        loading={categoryLoading}
      />

      {/* ==================== ITEM FORM DIALOG ==================== */}
      <ItemFormDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        item={editingItem}
        categories={categories}
        onSave={handleSaveItem}
        loading={itemLoading}
      />

      {/* ==================== DELETE CONFIRMATION DIALOG ==================== */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Confirmar exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-white">
                {deleteTarget?.name}
              </span>
              ?
              {deleteTarget?.type === "category" && (
                <span className="block text-sm text-red-400 mt-1">
                  Todos os itens desta categoria também serão excluídos.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Excluir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== CATEGORY FORM DIALOG ====================

function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSave,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category | null
  onSave: (data: CategoryFormData) => void
  loading: boolean
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    values: category
      ? { name: category.name, description: category.description || "" }
      : { name: "", description: "" },
  })

  const onSubmit = (data: CategoryFormData) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {category ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name" className="text-gray-300">
              Nome *
            </Label>
            <Input
              id="cat-name"
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: Pizzas, Bebidas..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-desc" className="text-gray-300">
              Descrição
            </Label>
            <Input
              id="cat-desc"
              {...register("description")}
              placeholder="Descrição opcional"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ==================== ITEM FORM DIALOG ====================

function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSave,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MenuItem | null
  categories: Category[]
  onSave: (data: ItemFormData) => void
  loading: boolean
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ItemFormData>({
    values: item
      ? {
          name: item.name,
          description: item.description || "",
          price: item.price,
          categoryId: item.categoryId,
          image: item.image || "",
          isAvailable: item.isAvailable,
          isPopular: item.isPopular,
          sizes: item.sizes || [],
          extras: item.extras || [],
        }
      : {
          name: "",
          description: "",
          price: 0,
          categoryId: categories[0]?.id || "",
          image: "",
          isAvailable: true,
          isPopular: false,
          sizes: [],
          extras: [],
        },
  })

  const {
    fields: sizeFields,
    append: appendSize,
    remove: removeSize,
  } = useFieldArray({ control, name: "sizes" })

  const {
    fields: extraFields,
    append: appendExtra,
    remove: removeExtra,
  } = useFieldArray({ control, name: "extras" })

  const onSubmit = (data: ItemFormData) => {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {item ? "Editar Item" : "Novo Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label className="text-gray-300">Nome *</Label>
            <Input
              {...register("name", { required: "Nome é obrigatório" })}
              placeholder="Ex: Pizza Margherita"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-gray-300">Descrição</Label>
            <Textarea
              {...register("description")}
              placeholder="Descrição do item"
              rows={3}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
            />
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Preço (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("price", {
                  required: "Preço é obrigatório",
                  valueAsNumber: true,
                  min: { value: 0.01, message: "Preço deve ser maior que 0" },
                })}
                placeholder="0,00"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              {errors.price && (
                <p className="text-xs text-red-400">
                  {errors.price.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Categoria *</Label>
              <Controller
                name="categoryId"
                control={control}
                rules={{ required: "Categoria é obrigatória" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-gray-300 focus:bg-gray-700 focus:text-white"
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-xs text-red-400">
                  {errors.categoryId.message}
                </p>
              )}
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label className="text-gray-300">URL da Imagem</Label>
            <Input
              {...register("image")}
              placeholder="https://..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex gap-8">
            <Controller
              name="isAvailable"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <Label className="text-gray-300 text-sm">Disponível</Label>
                </div>
              )}
            />
            <Controller
              name="isPopular"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                  <Label className="text-gray-300 text-sm">Popular</Label>
                </div>
              )}
            />
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Tamanhos</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendSize({ name: "", price: 0 })}
                className="text-orange-400 hover:text-orange-300 hover:bg-gray-800 h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
            {sizeFields.length > 0 && (
              <div className="space-y-2">
                {sizeFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <Input
                      {...register(`sizes.${index}.name`, {
                        required: "Nome obrigatório",
                      })}
                      placeholder="Ex: Grande"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`sizes.${index}.price`, {
                        valueAsNumber: true,
                      })}
                      placeholder="Preço"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSize(index)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extras */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-gray-300">Adicionais</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendExtra({ name: "", price: 0 })}
                className="text-orange-400 hover:text-orange-300 hover:bg-gray-800 h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
            {extraFields.length > 0 && (
              <div className="space-y-2">
                {extraFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <Input
                      {...register(`extras.${index}.name`, {
                        required: "Nome obrigatório",
                      })}
                      placeholder="Ex: Bacon"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register(`extras.${index}.price`, {
                        valueAsNumber: true,
                      })}
                      placeholder="Preço"
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 w-28"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExtra(index)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {loading && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
