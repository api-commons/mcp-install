import './style.css';
import './widget'; // registers <mcp-install-button> — the generator preview uses the real component
import { renderChooser } from './chooser';
import { renderGenerator } from './generator';
import { wireEngage } from './engage';

const app = document.getElementById('app')!;
const params = new URLSearchParams(location.search);

if (params.has('name') || params.has('server') || params.has('config')) {
  void renderChooser(app, params);
} else {
  renderGenerator(app);
}

const engage = document.getElementById('engage-ae');
if (engage) wireEngage(engage);
