import React from 'react';
import { Modal } from './Modal';
import { orderService } from '../services/orderService';
import { toast } from 'react-hot-toast';

interface ConfirmOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onConfirm: () => void;
}

export const ConfirmOrderModal: React.FC<ConfirmOrderModalProps> = ({ isOpen, onClose, orderId, onConfirm }) => {
  const handleConfirm = async () => {
    try {
      await orderService.confirmOrder(orderId);
      toast.success('Order confirmed!');
      onConfirm();
      onClose();
    } catch (error) {
      toast.error('Failed to confirm order');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Order">
      <p>Are you sure you want to confirm this order?</p>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">Cancel</button>
        <button onClick={handleConfirm} className="px-4 py-2 rounded-xl bg-strawberry-600 text-white">Confirm Order</button>
      </div>
    </Modal>
  );
};
