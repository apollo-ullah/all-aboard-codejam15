import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export interface SelectContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
});

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
};

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  children,
  ...props
}) => {
  const { open, setOpen } = React.useContext(SelectContext);

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext);
  return <span>{value || placeholder || 'Select...'}</span>;
};

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  const { open } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <div
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-md ${className}`}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
};

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  children: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  className = '',
  children,
  ...props
}) => {
  const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext);

  const handleClick = () => {
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus:bg-[hsl(var(--accent))] focus:text-[hsl(var(--accent-foreground))] ${
        selectedValue === value ? 'bg-[hsl(var(--accent))]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
