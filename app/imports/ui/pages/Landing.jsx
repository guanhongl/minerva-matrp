import React, { useState } from 'react';
import { Header, Image, Button } from 'semantic-ui-react';
import { NavLink } from 'react-router-dom';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';

/** A simple static component to render some text for the landing page. */
const Landing = () => {
  const [isLogin, setIsLogin] = useState(true);

  return(
    <div id="landing">
      {/* <div className="landing-center">
        <Grid id={PAGE_IDS.LANDING} verticalAlign='middle' textAlign='center' container centered>
          <Header className="landing-text" as="h1">MINERVA MEDICAL</Header>
        </Grid>
        <Divider section hidden/>
        <Grid verticalAlign="top" textAlign="center" container className='button-location'>
          <Grid.Column computer={5} tablet={7} mobile={11}>
            <Button id={COMPONENT_IDS.LANDING_TO_REGISTER} size="massive" as={NavLink} activeClassName="" exact to="/signup" key='signup' inverted
              style={{ font: 'Lato' }}>REGISTER</Button>
          </Grid.Column>
          <Grid.Column computer={5} tablet={7} mobile={9}>
            <Button id={COMPONENT_IDS.LANDING_TO_SIGN_IN} size="massive" as={NavLink} activeClassName="" exact to="/signin" key='signin' inverted
              style={{ font: 'Lato' }}>LOGIN</Button>
          </Grid.Column>
        </Grid>
      </div> */}
      <div className='landing-box'>
        <Image src='../images/minervaLogoBlack.png' size='tiny' />
        <Header as='h1' className='landing-header'>MINVERVA MEDICAL</Header>
      </div>
    </div>
  );
};

export default Landing;
