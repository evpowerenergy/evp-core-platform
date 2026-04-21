import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import { useProductsAPI as useProducts } from "@/hooks/useProductsAPI";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ProductItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name?: string;
  cost_price?: number;
}

interface ProductSearchDropdownProps {
  value: number;
  onValueChange: (value: number) => void;
  products: any[];
  placeholder?: string;
}

const ProductSearchDropdown = ({ value, onValueChange, products, placeholder = "เลือกสินค้า" }: ProductSearchDropdownProps) => {
  const [open, setOpen] = useState(false);
  const selectedProduct = products.find(product => product.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between truncate"
        >
          <span className="truncate block text-left">
            {selectedProduct ? (
              `${selectedProduct.name}${selectedProduct.brand ? ` - ${selectedProduct.brand}` : ''}${selectedProduct.model ? ` ${selectedProduct.model}` : ''}`
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="ค้นหาสินค้า..." />
          <CommandList>
            <CommandEmpty>ไม่พบสินค้า</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={`${product.name} ${product.brand || ''} ${product.model || ''}`}
                  onSelect={() => {
                    onValueChange(product.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{product.name}</span>
                    {(product.brand || product.model) && (
                      <span className="text-sm text-muted-foreground truncate">
                        {product.brand} {product.model}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface ProductSelectionSectionProps {
  selectedProducts: ProductItem[];
  onProductsChange: (products: ProductItem[]) => void;
}

const ProductSelectionSection = ({ selectedProducts, onProductsChange }: ProductSelectionSectionProps) => {
  const { data: products = [], isLoading: productsLoading } = useProducts(undefined, 1000);

  const addProduct = () => {
    const newProduct: ProductItem = {
      product_id: 0,
      quantity: undefined as any,
      unit_price: undefined as any,
      cost_price: 0,
    };
    onProductsChange([...selectedProducts, newProduct]);
  };

  const removeProduct = (index: number) => {
    const updatedProducts = selectedProducts.filter((_, i) => i !== index);
    onProductsChange(updatedProducts);
  };

  const updateProduct = (index: number, field: keyof ProductItem, value: number) => {
    const updatedProducts = selectedProducts.map((product, i) => {
      if (i === index) {
        let updatedProduct = { ...product, [field]: value };
        // ถ้าเปลี่ยนสินค้า ให้ดึง cost_price และชื่อจาก products
        if (field === 'product_id') {
          const selectedProductData = products.find(p => p.id === value);
          if (selectedProductData) {
            updatedProduct.product_name = selectedProductData.name;
            updatedProduct.unit_price = selectedProductData.unit_price;
            updatedProduct.cost_price = selectedProductData.cost_price;
          } else {
            updatedProduct.product_name = '';
            updatedProduct.unit_price = 0;
            updatedProduct.cost_price = 0;
          }
        }
        // ถ้าเปลี่ยน unit_price หรือ quantity ให้คำนวณใหม่
        if (field === 'unit_price' || field === 'quantity') {
          // ไม่ต้องทำอะไรเพิ่ม เพราะคำนวณใน render
        }
        return updatedProduct;
      }
      return product;
    });
    onProductsChange(updatedProducts);
  };

  if (productsLoading) {
    return <div>กำลังโหลดข้อมูลสินค้า...</div>;
  }

  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">รายการสินค้าที่เสนอขาย</h3>
        <Button 
          type="button" 
          onClick={addProduct} 
          variant="default" 
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-0 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มสินค้า
        </Button>
      </div>
      {selectedProducts.length === 0 ? (
        <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-200">
          <div className="mb-4">
            <Plus className="h-12 w-12 text-blue-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-2">ยังไม่มีรายการสินค้า</p>
            <p className="text-gray-500 text-sm">กดปุ่มเพิ่มสินค้าด้านบนเพื่อเริ่มเพิ่มรายการ</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedProducts.map((product, index) => {
            const productData: any = products.find(p => p.id === product.product_id) || {};
            const costPrice = productData.cost_price || 0;
            const unitPrice = product.unit_price === undefined || product.unit_price === null ? 0 : product.unit_price;
            const quantity = product.quantity === undefined || product.quantity === null ? 0 : product.quantity;
            const totalPrice = unitPrice * quantity;
            const totalCost = costPrice * quantity;
            const profit = totalPrice - totalCost;
            const profitPercent = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;
            return (
              <div
                key={index}
                className="relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 mb-2 overflow-hidden group"
              >
                {/* ปุ่มลบ */}
                <button
                  type="button"
                  onClick={() => removeProduct(index)}
                  className="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  title="ลบรายการนี้"
                >
                  <X className="h-4 w-4" />
                </button>
                {/* dropdown สินค้า เต็มความกว้าง ด้านบน */}
                <div className="mb-4">
                  <Label className="text-xs text-gray-600 mb-1 block">สินค้า</Label>
                  <ProductSearchDropdown
                    value={product.product_id}
                    onValueChange={(value) => updateProduct(index, 'product_id', value)}
                    products={products}
                    placeholder="เลือกสินค้า"
                  />
                </div>
                {/* input หลักและข้อมูลคำนวณ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">จำนวน</Label>
                    <Input
                      type="number"
                      value={product.quantity === undefined || product.quantity === null ? '' : product.quantity}
                      onChange={e => {
                        const val = e.target.value;
                        updateProduct(index, 'quantity', val === '' ? undefined : parseInt(val));
                      }}
                      className="text-sm appearance-none"
                      style={{
                        MozAppearance: 'textfield',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                      }}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">ราคาขายต่อหน่วย (฿)</Label>
                    <Input
                      type="number"
                      value={product.unit_price === undefined || product.unit_price === null ? '' : product.unit_price}
                      onChange={e => {
                        const val = e.target.value;
                        updateProduct(index, 'unit_price', val === '' ? undefined : parseFloat(val));
                      }}
                      className="text-sm appearance-none"
                      style={{
                        MozAppearance: 'textfield',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                      }}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">ต้นทุนต่อหน่วย (฿)</Label>
                    <Input
                      type="number"
                      value={costPrice}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                  {/* ช่องว่างเพื่อความสมดุล grid */}
                  <div className="hidden md:block" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">ราคารวมไม่รวม vat</Label>
                    <Input
                      type="text"
                      value={`฿ ${totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">ต้นทุนรวม</Label>
                    <Input
                      type="text"
                      value={`฿ ${totalCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">กำไร</Label>
                    <Input
                      type="text"
                      value={`฿ ${profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">% กำไร</Label>
                    <Input
                      type="text"
                      value={`% ${profitPercent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>
                {/* divider */}
                {index !== selectedProducts.length - 1 && (
                  <div className="absolute left-4 right-4 bottom-0 h-px bg-gray-100 mt-6" />
                )}
              </div>
            );
          })}
          <div className="text-right">
            <div className="text-lg font-semibold">
              ยอดรวมทั้งหมด: {selectedProducts.reduce((total, product) => {
                const productData = products.find(p => p.id === product.product_id) || {};
                const unitPrice = product.unit_price || 0;
                const quantity = product.quantity || 0;
                return total + (unitPrice * quantity);
              }, 0).toLocaleString()} บาท
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductSelectionSection;

