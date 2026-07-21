
import React, { useRef } from 'react';
import { Order } from '../../types';
import { Printer, X } from 'lucide-react';

export const KitchenTicketModal: React.FC<{ order: Order; onClose: () => void }> = ({ order, onClose }) => {
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
            <div className="w-full max-w-md bg-white text-black rounded-2xl shadow-card overflow-hidden relative">
                <div className="absolute top-4 right-4 flex gap-2 print:hidden">
                    <button onClick={handlePrint} aria-label="Print" className="flex h-11 w-11 items-center justify-center rounded-full bg-app-elevated text-app-text hover:bg-app-muted/15 transition-colors">
                        <Printer className="h-5 w-5" />
                    </button>
                    <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-app-elevated text-app-text hover:bg-app-muted/15 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div ref={printRef} className="p-6 space-y-6 print:p-0 print:m-0 font-mono">
                    <div className="text-center border-b-2 border-black pb-4">
                        <h2 className="text-2xl font-black">KITCHEN TICKET</h2>
                        <div className="flex justify-between mt-2 text-sm font-bold">
                            <span>#{order.orderNumber}</span>
                            <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                         {order.priority === 'high' && (
                            <div className="mt-2 text-center border-2 border-black p-1 font-black uppercase">
                                !!! RUSH ORDER !!!
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <span className="font-black text-xl w-8">{item.quantity}</span>
                                <div className="flex-1">
                                    <span className="font-bold text-lg block leading-tight">{item.recipeName}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {order.notes && (
                        <div className="border-t-2 border-dashed border-black pt-4 mt-4">
                            <p className="font-bold uppercase text-xs mb-1">Notes:</p>
                            <p className="text-sm font-bold">{order.notes}</p>
                        </div>
                    )}

                    <div className="text-center pt-6 text-xs font-bold uppercase">
                        --- End of Ticket ---
                    </div>
                </div>
            </div>
        </div>
    );
};
