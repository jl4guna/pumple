import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Expense, ApiResponse } from '@/app/types';

const ExpenseManagementPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState({
    concept: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    isReimbursed: false,
    paidBy: 'Eli' as 'Eli' | 'Pan',
  });

  // Estado para edición
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    concept: '',
    amount: '',
    paymentDate: '',
    paidBy: 'Eli' as 'Eli' | 'Pan',
  });

  // Fetch expenses
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/expenses');
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setExpenses(data.data);
      } else {
        throw new Error(data.error || 'Error al cargar gastos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newExpense,
          amount: parseFloat(newExpense.amount),
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setExpenses([data.data, ...expenses]);
        setNewExpense({
          concept: '',
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          isReimbursed: false,
          paidBy: 'Eli',
        });
      } else {
        throw new Error(data.error || 'Error al crear gasto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const handleUpdateReimbursed = async (id: number, isReimbursed: boolean) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isReimbursed }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setExpenses(expenses.map((exp) => (exp.id === id ? data.data : exp)));
      } else {
        throw new Error(data.error || 'Error al actualizar gasto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Función para eliminar un gasto
  const handleDeleteExpense = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar el estado local eliminando el gasto
        setExpenses(expenses.filter((expense) => expense.id !== id));
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar gasto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  // Funciones para editar un gasto
  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditForm({
      concept: expense.concept,
      amount: expense.amount.toString(),
      paymentDate: expense.paymentDate,
      paidBy: expense.paidBy,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const response = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        // Actualizar el estado local con el gasto editado
        setExpenses(
          expenses.map((exp) =>
            exp.id === editingExpense.id ? data.data : exp
          )
        );
        setIsEditDialogOpen(false);
      } else {
        throw new Error(data.error || 'Error al actualizar gasto');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-MX');
    } catch (e) {
      return dateString || 'Fecha inválida';
    }
  };

  return (
    <div className='container mx-auto p-4'>
      <h1 className='text-2xl font-bold mb-6'>Administración de Gastos</h1>

      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className='mb-8 space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Input
            placeholder='Concepto'
            value={newExpense.concept}
            onChange={(e) =>
              setNewExpense({ ...newExpense, concept: e.target.value })
            }
            required
          />
          <Input
            type='number'
            placeholder='Monto'
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
            required
            min='0'
            step='0.01'
          />
          <Input
            type='date'
            value={newExpense.paymentDate}
            onChange={(e) =>
              setNewExpense({ ...newExpense, paymentDate: e.target.value })
            }
            required
          />
        </div>
        <div className='flex items-center space-x-4'>
          <div className='w-[180px]'>
            <Select
              value={newExpense.paidBy}
              onValueChange={(value: 'Eli' | 'Pan') => {
                setNewExpense({ ...newExpense, paidBy: value });
              }}>
              <SelectTrigger>
                <SelectValue placeholder='Pagado por' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Eli'>Eli</SelectItem>
                <SelectItem value='Pan'>Pan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isReimbursed'
              checked={newExpense.isReimbursed}
              onCheckedChange={(checked) =>
                setNewExpense({ ...newExpense, isReimbursed: !!checked })
              }
            />
            <label htmlFor='isReimbursed'>Reembolsado</label>
          </div>
          <Button type='submit'>Agregar Gasto</Button>
        </div>
      </form>

      {isLoading ? (
        <div className='text-center py-4'>Cargando gastos...</div>
      ) : expenses.length === 0 ? (
        <div className='text-center py-4'>No hay gastos registrados</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Pagado por</TableHead>
              <TableHead>Reembolsado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.concept}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{formatDate(expense.paymentDate)}</TableCell>
                <TableCell>{expense.paidBy}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={expense.isReimbursed}
                    onCheckedChange={(checked) =>
                      handleUpdateReimbursed(expense.id, !!checked)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleEditClick(expense)}>
                      Editar
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteExpense(expense.id)}>
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Diálogo de edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Gasto</DialogTitle>
            <DialogDescription>
              Actualiza los detalles del gasto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className='space-y-4 py-4'>
            <div className='space-y-4'>
              <div>
                <label htmlFor='edit-concept' className='text-sm font-medium'>
                  Concepto
                </label>
                <Input
                  id='edit-concept'
                  value={editForm.concept}
                  onChange={(e) =>
                    setEditForm({ ...editForm, concept: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor='edit-amount' className='text-sm font-medium'>
                  Monto
                </label>
                <Input
                  id='edit-amount'
                  type='number'
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amount: e.target.value })
                  }
                  required
                  min='0'
                  step='0.01'
                />
              </div>

              <div>
                <label htmlFor='edit-date' className='text-sm font-medium'>
                  Fecha
                </label>
                <Input
                  id='edit-date'
                  type='date'
                  value={editForm.paymentDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, paymentDate: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor='edit-paidBy' className='text-sm font-medium'>
                  Pagado por
                </label>
                <Select
                  value={editForm.paidBy}
                  onValueChange={(value: 'Eli' | 'Pan') =>
                    setEditForm({ ...editForm, paidBy: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='Pagado por' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Eli'>Eli</SelectItem>
                    <SelectItem value='Pan'>Pan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type='submit'>Guardar Cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpenseManagementPage;
