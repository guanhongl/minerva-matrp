import React from 'react';
import { Header, Image } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => {
  return (
    <footer>
      <Header inverted as='h3'>Designed by Minerva Medical</Header>
      <Image src = '../images/minervaLogo.png' size='tiny' centered/>
      <NavLink exact to="/about" key="about" id="about">About</NavLink>
      <br/>
      <a href="https://minerva-medical.github.io" target='_blank' rel='noreferrer'>Our Project Page</a>
    </footer>
  );
};

export default Footer;
