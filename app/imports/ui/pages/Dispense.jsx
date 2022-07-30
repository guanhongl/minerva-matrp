import React from 'react';
import { Container, Menu } from 'semantic-ui-react';
import DispenseDrug from '../components/dispense-inventory/DispenseDrug';
import DispenseVaccine from '../components/dispense-inventory/DispenseVaccine';
import DispenseSupply from '../components/dispense-inventory/DispenseSupply';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import { NavLink, Switch, Route, useRouteMatch } from 'react-router-dom';

const Dispense = () => {
  const { path, url } = useRouteMatch();

  return (
    <Container id={PAGE_IDS.DISPENSE}>
      <Menu attached tabular>
        <Menu.Item
          key={COMPONENT_IDS.DISPENSE_TAB_ONE} id={COMPONENT_IDS.DISPENSE_TAB_ONE}
          as={NavLink} activeClassName="active" to={`${url}/drug`} content="Drugs"
        />
        <Menu.Item
          key={COMPONENT_IDS.DISPENSE_TAB_TWO} id={COMPONENT_IDS.DISPENSE_TAB_TWO}
          as={NavLink} activeClassName="active" to={`${url}/vaccine`} content="Vaccines"
        />
        <Menu.Item
          key={COMPONENT_IDS.DISPENSE_TAB_THREE} id={COMPONENT_IDS.DISPENSE_TAB_THREE}
          as={NavLink} activeClassName="active" to={`${url}/supply`} content="Supplies"
        />
      </Menu>

      <Switch>
        <Route exact path={path}>
          <h3>Please select an item.</h3>
        </Route>
        <Route path={`${path}/drug`} component={DispenseDrug}/>
        <Route path={`${path}/vaccine`} component={DispenseVaccine}/>
        <Route path={`${path}/supply`} component={DispenseSupply}/>
      </Switch>
    </Container>
  );
};

export default Dispense;
