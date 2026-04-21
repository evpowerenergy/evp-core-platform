import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

const PackageLeadTimeline = () => {
  const { id } = useParams();
  return <Navigate to={`/leads/${id}/timeline`} replace />;
};

export default PackageLeadTimeline;
