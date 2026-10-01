import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useEmployeeData } from '../../contexts/EmployeeDataContext';
import { PortalMessage } from '../../components/portal/PortalMessage';
import { LinkIcon } from 'lucide-react';

/** Older per-form links now open the form inside the employee's portal. */
export function EmployeeFormLink() {
  const { assignmentId } = useParams();
  const { assignments, employees } = useEmployeeData();
  const assignment = assignments.find((item) => item.id === assignmentId);
  const employee = employees.find((item) => item.id === assignment?.employeeId);

  if (!assignment || !employee) {
    return (
      <PortalMessage
        icon={LinkIcon}
        title="This link is not valid"
        body="The link you followed does not match a form we have on record." />);


  }
  return <Navigate to={`/portal/${employee.portalToken}?form=${assignment.id}`} replace />;
}
