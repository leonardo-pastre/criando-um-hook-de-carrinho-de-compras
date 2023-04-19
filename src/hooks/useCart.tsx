import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const itemCart = updatedCart.find(item => item.id === productId)
      const currentQuantity = itemCart ? itemCart.amount : 0
      const stockQuantity = await api.get(`stock/${productId}`).then(response => response.data.amount)
      const quantity = currentQuantity + 1

      if (quantity > stockQuantity) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }
      
      if (itemCart) {
        itemCart.amount += 1
      } else {
        const product = await api.get(`products/${productId}`).then(response => response.data)
        const newItemCart = { ...product, amount: 1 }
        updatedCart.push(newItemCart)
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productIndex = updatedCart.findIndex(product => product.id === productId)

      if (productIndex < 0) {
        throw new Error()
      }

      updatedCart.splice(productIndex, 1)
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) return

      const updatedCart = [...cart]
      const itemCart = updatedCart.find(item => item.id === productId)
      const stockAmount = await api.get(`http://localhost:3333/stock/${productId}`).then(response => response.data.amount)

      if (!itemCart) {
        throw new Error()
      }

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return
      }

      itemCart.amount = amount
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
