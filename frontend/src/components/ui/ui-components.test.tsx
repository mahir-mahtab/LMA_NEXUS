import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import Button from './Button';
import Badge from './Badge';
import Card from './Card';
import Input from './Input';
import Textarea from './Textarea';
import Select from './Select';
import Table from './Table';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

describe('UI Components', () => {
  test('Button renders correctly', () => {
    render(<Button>Test Button</Button>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  test('Badge renders correctly', () => {
    render(<Badge value="test" />);
    expect(screen.getByText('test')).toBeInTheDocument();
  });

  test('Card renders correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('Input renders correctly', () => {
    render(<Input label="Test Input" />);
    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  test('Textarea renders correctly', () => {
    render(<Textarea label="Test Textarea" />);
    expect(screen.getByLabelText('Test Textarea')).toBeInTheDocument();
  });

  test('Select renders correctly', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    render(<Select label="Test Select" options={options} />);
    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
  });

  test('Table renders correctly', () => {
    const columns = [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' }
    ];
    const data = [
      { name: 'Test', value: '123' }
    ];
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  test('LoadingSkeleton renders correctly', () => {
    render(<LoadingSkeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  test('EmptyState renders correctly', () => {
    render(<EmptyState title="No Data" />);
    expect(screen.getByText('No Data')).toBeInTheDocument();
  });
});