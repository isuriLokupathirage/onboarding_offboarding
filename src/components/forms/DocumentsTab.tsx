import React, { useState } from 'react';
import { GripVerticalIcon, InfoIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { DocumentType, EmployeeForm } from '../../types';
import { Button } from '../ui/Button';
import { FieldGroup, Input, Select } from '../ui/Field';
import { PillToggle } from '../ui/Toggle';
import { documentTypes } from '../../data/forms';
import { useAppData } from '../../contexts/AppDataContext';

export function DocumentsTab({ form }: {form: EmployeeForm;}) {
  const { addDocument, updateDocument, removeDocument } = useAppData();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<DocumentType>('National ID');
  const [error, setError] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) {
      setError(true);
      return;
    }
    addDocument(form.id, {
      id: `doc-${Date.now()}`,
      name: name.trim(),
      type,
      required: true,
      multiple: false
    });
    setName('');
    setType('National ID');
    setError(false);
    setAdding(false);
  };

  return (
    <div>
      <div className="flex items-start gap-2.5 rounded-lg bg-slate-50 px-3.5 py-3 ring-1 ring-inset ring-line">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-subtle" />
        <p className="text-[13px] leading-relaxed text-muted">
          Accepted formats are PDF, PNG, JPG, JPEG and DOCX, up to 25 MB per field.
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {form.documents.map((doc) =>
        <div
          key={doc.id}
          className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-white px-4 py-3">
          
            <button
            type="button"
            aria-label={`Reorder ${doc.name}`}
            className="cursor-grab text-slate-300 transition-colors duration-150 ease-out hover:text-subtle">
            
              <GripVerticalIcon className="h-4 w-4" />
            </button>
            <div className="min-w-[200px] flex-1">
              <p className="text-[13px] font-medium text-ink">{doc.name}</p>
              <p className="mt-0.5 text-[12px] text-muted">{doc.type}</p>
            </div>
            <PillToggle
            options={[
            { value: 'required', label: 'Required' },
            { value: 'optional', label: 'Optional' }]
            }
            value={doc.required ? 'required' : 'optional'}
            onChange={(value) => updateDocument(form.id, doc.id, { required: value === 'required' })} />
          
            <PillToggle
            options={[
            { value: 'single', label: 'Single file' },
            { value: 'multiple', label: 'Multiple files' }]
            }
            value={doc.multiple ? 'multiple' : 'single'}
            onChange={(value) => updateDocument(form.id, doc.id, { multiple: value === 'multiple' })} />
          
            <button
            type="button"
            aria-label={`Remove ${doc.name}`}
            onClick={() => removeDocument(form.id, doc.id)}
            className="rounded-lg p-1.5 text-subtle transition-colors duration-150 ease-out hover:bg-red-50 hover:text-red-600">
            
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {adding ?
      <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Document Name" required>
              <Input
              value={name}
              autoFocus
              onChange={(event) => {
                setName(event.target.value);
                setError(false);
              }}
              placeholder='e.g. "Highest Educational Qualification"'
              className={error ? 'border-red-300' : ''} />
            
              {error && <p className="mt-1.5 text-[12px] text-red-600">Document name is required.</p>}
            </FieldGroup>
            <FieldGroup label="Document Type" required>
              <Select value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
                {documentTypes.map((option) =>
              <option key={option} value={option}>
                    {option}
                  </option>
              )}
              </Select>
            </FieldGroup>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button
            size="sm"
            onClick={() => {
              setAdding(false);
              setError(false);
              setName('');
            }}>
            
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleAdd}>
              Add Document
            </Button>
          </div>
        </div> :

      <Button className="mt-3" onClick={() => setAdding(true)}>
          <PlusIcon className="h-4 w-4" />
          Add Document
        </Button>
      }
    </div>);

}