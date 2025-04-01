// components/ui/numeric-input.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils'; // Utility for combining class names

// Extend InputProps to inherit standard input attributes and add custom ones
interface NumericInputProps
  extends Omit<InputProps, 'onChange' | 'value' | 'type'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  buttonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0, // Default min value
      max,
      step = 1, // Default step value
      buttonVariant = 'outline',
      buttonSize = 'sm',
      ...props // Pass remaining InputProps (like placeholder, id, etc.)
    },
    ref
  ) => {
    const handleIncrement = () => {
      const newValue = value + step;
      if (max === undefined || newValue <= max) {
        onChange(newValue);
      }
    };

    const handleDecrement = () => {
      const newValue = value - step;
      if (min === undefined || newValue >= min) {
        onChange(newValue);
      }
    };

    // Handle direct input change, ensuring value stays within bounds
    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = parseInt(event.target.value, 10);
      if (isNaN(newValue)) {
        newValue = min !== undefined ? min : 0; // Default to min or 0 if input is invalid
      }
      if (min !== undefined) {
        newValue = Math.max(min, newValue);
      }
      if (max !== undefined) {
        newValue = Math.min(max, newValue);
      }
      onChange(newValue);
    };

    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {/* Decrement Button */}
        <Button
          type='button' // Prevent form submission
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleDecrement}
          disabled={min !== undefined && value <= min} // Disable if at min value
          className='px-2' // Adjust padding if needed
        >
          -
        </Button>

        {/* Input Field */}
        <Input
          ref={ref}
          type='number' // Keep type="number" for semantics and mobile keyboard, but style might hide spinners
          value={value}
          onChange={handleInputChange} // Use custom handler
          min={min}
          max={max}
          step={step}
          className='text-center w-16' // Center text and give a fixed width
          {...props} // Spread remaining props
        />

        {/* Increment Button */}
        <Button
          type='button' // Prevent form submission
          variant={buttonVariant}
          size={buttonSize}
          onClick={handleIncrement}
          disabled={max !== undefined && value >= max} // Disable if at max value
          className='px-2' // Adjust padding if needed
        >
          +
        </Button>
      </div>
    );
  }
);

NumericInput.displayName = 'NumericInput';

export { NumericInput };
