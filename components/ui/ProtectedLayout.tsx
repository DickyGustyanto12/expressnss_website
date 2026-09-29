import { Navigate, Outlet } from 'react-router-dom';

const ProtectedLayout = () => {
    const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true';

    return isAuthenticated ? <Outlet /> : <Navigate to="/internal" replace />;
};

export default ProtectedLayout;