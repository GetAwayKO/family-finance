import "./_sidebar.scss";
import SidebarItem from "./SidebarItem";
interface SidebarProps {
  show: boolean;
}
export default function Sidebar({ show }: SidebarProps) {
  return (
    <>
      <div hidden={show} className="sidebar">
        <ul>
          <SidebarItem>Suck</SidebarItem>
          <SidebarItem>Suck</SidebarItem>
          <SidebarItem>Suck</SidebarItem>
        </ul>
      </div>
    </>
  );
}
