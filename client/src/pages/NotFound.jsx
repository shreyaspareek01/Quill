import { Link } from 'react-router-dom';
import { Feather, ArrowLeft } from 'lucide-react';
import PageWrapper from '../components/PageWrapper';
import './NotFound.css';

export default function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="notfound">
        <Feather size={40} strokeWidth={1} className="notfound__icon" />
        <h1 className="notfound__code">404</h1>
        <h2 className="notfound__title">Page not found</h2>
        <p className="notfound__sub">
          The page you're looking for has either moved, or was never written.
        </p>
        <Link to="/" className="btn btn-primary notfound__btn">
          <ArrowLeft size={15} strokeWidth={2} />
          Go home
        </Link>
      </div>
    </PageWrapper>
  );
}
