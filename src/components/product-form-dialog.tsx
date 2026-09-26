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
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductCreateInput } from "@/lib/products";

type ProductFormValues = {
  productCode: string;
  productName: string;
  categoryId: number;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (values: ProductCreateInput) => Promise<void>;
};

const emptyValues: ProductFormValues = {
  productCode: "",
  productName: "",
  categoryId: 1,
  description: "",
  price: 0,
  quantity: 0,
  imageUrl: "",
};

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
        </DialogHeader>
        {open && (
          <ProductForm
            key={product?.id ?? "new"}
            product={product}
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
  onSubmit,
}: {
  product?: Product | null;
  onSubmit: (values: ProductCreateInput) => Promise<void>;
}) {
  const [values, setValues] = useState<ProductFormValues>(
    product
      ? {
          productCode: product.productCode,
          productName: product.productName,
          categoryId: product.categoryId,
          description: product.description ?? "",
          price: product.price,
          quantity: product.quantity,
          imageUrl: product.imageUrl ?? "",
        }
      : emptyValues
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    if (!Number.isInteger(values.categoryId) || values.categoryId < 1) {
      setError("Category ID must be a positive whole number.");
      return;
    }
    if (!Number.isFinite(values.price) || values.price < 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (!Number.isInteger(values.quantity) || values.quantity < 0) {
      setError("Quantity must be a positive whole number.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch {
      setError("Something went wrong saving the product. Please try again.");
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
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-code">Product code</Label>
        <Input
          id="product-code"
          value={values.productCode}
          onChange={(e) =>
            setValues((v) => ({ ...v, productCode: e.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-name">Name</Label>
        <Input
          id="product-name"
          value={values.productName}
          onChange={(e) =>
            setValues((v) => ({ ...v, productName: e.target.value }))
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-category">Category ID</Label>
        <Input
          id="product-category"
          type="number"
          min="1"
          step="1"
          value={values.categoryId}
          onChange={(e) =>
            setValues((v) => ({ ...v, categoryId: e.target.valueAsNumber }))
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          rows={3}
          value={values.description}
          onChange={(e) =>
            setValues((v) => ({ ...v, description: e.target.value }))
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-price">Price (USD)</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) =>
              setValues((v) => ({ ...v, price: e.target.valueAsNumber }))
            }
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
            onChange={(e) =>
              setValues((v) => ({ ...v, quantity: e.target.valueAsNumber }))
            }
          />
        </div>
      </div>
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
