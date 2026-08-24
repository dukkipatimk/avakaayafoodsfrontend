import React from 'react';
import { Link } from 'react-router-dom';
import Combos from '../components/Combos';
import Seo from '../components/Seo';
import './CombosPage.css';

// Dedicated combos listing. The Combos component already fetches every live
// combo and handles both add-to-cart and the pick-any builder, so the page is
// a heading and a frame around it rather than a second implementation.
const CombosPage = () => (
  <div className="combos-page">
    <Seo
      title="Combos & Value Packs | Avakaaya Foods"
      description="Save more with Avakaaya Foods combo packs — pick-any pickle bundles, family packs and curated value sets of authentic Telugu pickles, podis, snacks and sweets."
    />

    <header className="combos-page-head">
      <div className="container">
        <nav className="combos-page-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link> <span aria-hidden="true">›</span> <span>Combos</span>
        </nav>
        <h1>Save more with combos</h1>
        <p>
          Bundles priced below the sum of their parts. Pick-any packs let you choose
          the jars yourself; fixed packs go straight to your cart.
        </p>
      </div>
    </header>

    <div className="container combos-page-body">
      <Combos />
      <p className="combos-page-empty-note">
        Not seeing a combo you want? <Link to="/gift-hamper">Build your own hamper</Link> instead.
      </p>
    </div>
  </div>
);

export default CombosPage;
