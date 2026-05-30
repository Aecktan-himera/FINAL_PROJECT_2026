//import { useTabsStore } from '../stores/tabsStore';
import { LiquidGlass } from '../ui/LiquidGlass';

export const Footer = () => {
    return (
    <LiquidGlass as="footer" className="p-6 m-4 text-center text-blue-900/70 text-sm">
      © 2026 Liquid Glass UI. Все права защищены.
      <a href="https://www.flaticon.com/free-icons/task-management" title="task management icons">
        Task management icons created by Freepik - Flaticon
      </a>
    </LiquidGlass>
  );
}