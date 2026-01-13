import React from 'react';
import { 
  Button, 
  Badge, 
  Card, 
  Input, 
  Textarea, 
  Select, 
  Table, 
  LoadingSkeleton, 
  EmptyState 
} from './index';

// This file demonstrates that all UI components can be imported and used
export const UIComponentsDemo: React.FC = () => {
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' }
  ];

  const tableColumns = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' }
  ];

  const tableData = [
    { name: 'John Doe', role: 'Agent' },
    { name: 'Jane Smith', role: 'Legal' }
  ];

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">UI Components Demo</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex space-x-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Badges</h2>
        <div className="flex space-x-2">
          <Badge variant="role" value="Agent" />
          <Badge variant="severity" value="High" />
          <Badge variant="status" value="Ready" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Card</h2>
        <Card>
          <h3 className="font-semibold">Card Title</h3>
          <p>This is card content.</p>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Form Controls</h2>
        <Input label="Email" type="email" />
        <Textarea label="Description" />
        <Select label="Role" options={selectOptions} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Table</h2>
        <Table columns={tableColumns} data={tableData} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Loading Skeleton</h2>
        <LoadingSkeleton lines={3} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Empty State</h2>
        <EmptyState 
          title="No data available" 
          description="There's nothing to show here yet."
        />
      </div>
    </div>
  );
};