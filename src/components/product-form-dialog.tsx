"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageInput } from "@/components/image-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/api-error";
import type { Category } from "@/lib/categories";
import type { Product, ProductUpdateInput } from "@/lib/products";

type ProductFormValues = {
  productCode: string;
  productName: string;
  categoryId: string;
  description: string;
  // Kept as text so a cleared number box stays empty instead of becoming NaN.
  price: string;
  quantity: string;
  imageUrl: string;
  isActive: boolean;
};

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSubmit: (values: ProductUpdateInput) => Promise<void>;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSubmit,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ProductForm
            key={product?.id ?? "new"}
            product={product}
            categories={categories}
            onSubmit={async (values) => {
              await onSubmit(values);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({
  product,
  categories,
  onSubmit,
}: {
  product?: Product | null;
  categories: Category[];
  onSubmit: (values: ProductUpdateInput) => Promise<void>;
}) {
  const [values, setValues] = useState<ProductFormValues>(
    product
      ? {
          productCode: product.productCode,
          productName: product.productName,
          categoryId: String(product.categoryId),
          description: product.description ?? "",
          price: String(product.price),
          quantity: String(product.quantity),
          imageUrl: product.imageUrl ?? "",
          isActive: product.isActive,
        }
      : {
          productCode: "",
          productName: "",
          categoryId: "",
          description: "",
          price: "",
          quantity: "",
          imageUrl: "",
          isActive: true,
        }
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const categoryItems = categories.map((c) => ({ value: String(c.id), label: c.name }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values.productCode.trim()) {
      setError("Product code is required.");
      return;
    }
    if (!values.productName.trim()) {
      setError("Name is required.");
      return;
    }
    if (!values.categoryId) {
      setError("Choose a category.");
      return;
    }
    const price = Number(values.price);
    const quantity = Number(values.quantity);
    if (values.price.trim() === "" || !Number.isFinite(price) || price < 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (values.quantity.trim() === "" || !Number.isInteger(quantity) || quantity < 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        productCode: values.productCode.trim(),
        productName: values.productName.trim(),
        categoryId: Number(values.categoryId),
        description: values.description,
        price,
        quantity,
        imageUrl: values.imageUrl,
        isActive: values.isActive,
      });
    } catch (err) {
      setError(errorMessage(err, "Something went wrong saving the product. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <ImageInput
        value={values.imageUrl}
        onChange={(imageUrl) => setValues((v) => ({ ...v, imageUrl }))}
        onUploadingChange={setUploadingImage}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-code">Product code</Label>
          <Input
            id="product-code"
            value={values.productCode}
            onChange={(e) => setValues((v) => ({ ...v, productCode: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">Name</Label>
          <Input
            id="product-name"
            value={values.productName}
            onChange={(e) => setValues((v) => ({ ...v, productName: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-category">Category</Label>
        <Select
          items={categoryItems}
          value={values.categoryId || null}
          onValueChange={(value) =>
            setValues((v) => ({ ...v, categoryId: (value as string | null) ?? "" }))
          }
        >
          <SelectTrigger id="product-category" className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          rows={3}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-price">Price (USD)</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-quantity">Quantity</Label>
          <Input
            id="product-quantity"
            type="number"
            min="0"
            step="1"
            value={values.quantity}
            onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))}
          />
        </div>
      </div>
      {product && (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div>
            <Label htmlFor="product-active">Active</Label>
            <p className="text-xs text-muted-foreground">Inactive products are hidden from the shop.</p>
          </div>
          <Switch
            id="product-active"
            checked={values.isActive}
            onCheckedChange={(isActive) => setValues((v) => ({ ...v, isActive }))}
          />
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={submitting || uploadingImage}>
          {submitting
            ? "Saving..."
            : uploadingImage
              ? "Uploading image..."
              : product
                ? "Save changes"
                : "Add product"}
        </Button>
      </DialogFooter>
    </form>
  );
}
