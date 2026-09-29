import { LogoMark } from "../logo/Logo";
import "./_footer.scss";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__brand">
          <LogoMark size={20} />
          Cash Flow
        </span>
        <span className="footer__text">Учёт личных и семейных финансов</span>
        <span className="footer__copy">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
