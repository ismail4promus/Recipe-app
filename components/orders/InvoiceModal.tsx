import React, { useRef } from 'react';
import { Order } from '../../types';
import { Printer, X, ChefHat } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const InvoiceModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const content = printRef.current?.innerHTML;
        const originalContent = document.body.innerHTML;
        if (content) {
            document.body.innerHTML = content;
            window.print();
            document.body.innerHTML = originalContent;
            window.location.reload();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white text-black rounded-lg shadow-2xl overflow-hidden relative">
                <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                    <button onClick={handlePrint} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                        <Printer className="h-5 w-5" />
                    </button>
                    <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div ref={printRef} className="p-10 space-y-8 print:p-0 print:m-0">
                    <div className="flex justify-between items-start border-b pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                            <p className="text-gray-500 font-medium">#{order.orderNumber}</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-2">
                                <ChefHat className="h-6 w-6 text-black" />
                                <span className="font-bold text-xl">iKITCHEN</span>
                            </div>
                            <p className="text-sm text-gray-500">123 Culinary Ave.</p>
                            <p className="text-sm text-gray-500">Food City, FC 90210</p>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                            <p className="font-bold text-lg">{order.customerName}</p>
                            {order.deliveryAddress && <p className="text-sm text-gray-600 max-w-xs">{order.deliveryAddress}</p>}
                            {order.customerPhone && <p className="text-sm text-gray-600">{order.customerPhone}</p>}
                        </div>
                        <div className="text-right">
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                             <p className="font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">Due Date</p>
                             <p className="font-bold">{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : 'ASAP'}</p>
                        </div>
                    </div>

                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                            <tr>
                                <th className="px-4 py-3 text-left">Item Description</th>
                                <th className="px-4 py-3 text-center">Qty</th>
                                <th className="px-4 py-3 text-right">Unit Price</th>
                                <th className="px-4 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {order.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-sm font-medium">{item.recipeName}</td>
                                    <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                                    <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency(item.unitPrice * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end pt-4 border-t">
                        <div className="w-64 space-y-2">
                             <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between font-black text-xl pt-4 border-t border-gray-200">
                                <span>Total</span>
                                <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
