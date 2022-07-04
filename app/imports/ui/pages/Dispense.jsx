import React from 'react';
import { Container, Menu, Tab } from 'semantic-ui-react';
import DispenseDrug from '../components/dispense-inventory/DispenseDrug';
import DispenseVaccine from '../components/dispense-inventory/DispenseVaccine';
import DispenseSupply from '../components/dispense-inventory/DispenseSupply';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import { useQuery } from '../utilities/Functions';

const medicationTab = () => <DispenseDrug/>;
const vaccinesTab = () => <DispenseVaccine/>;
const suppliesTab = () => <DispenseSupply/>;

const panes = [
  { menuItem: <Menu.Item key={COMPONENT_IDS.DISPENSE_TAB_ONE} id={COMPONENT_IDS.DISPENSE_TAB_ONE}>Drugs</Menu.Item>, render: medicationTab },
  { menuItem: <Menu.Item key={COMPONENT_IDS.DISPENSE_TAB_TWO} id={COMPONENT_IDS.DISPENSE_TAB_TWO}>Vaccines</Menu.Item>, render: vaccinesTab },
  { menuItem: <Menu.Item key={COMPONENT_IDS.DISPENSE_TAB_THREE} id={COMPONENT_IDS.DISPENSE_TAB_THREE}>Supplies</Menu.Item>, render: suppliesTab },
];

// TODO: find a better solution to tab change from query
const Dispense = () => {
  const query = useQuery();

  return (
    <Container id={PAGE_IDS.DISPENSE}>
      {
        query.get("tab") ?
          <Tab panes={panes} activeIndex={query.get("tab")} onTabChange={() => window.location.hash="/dispense"} />
          :
          <Tab panes={panes} />
      }
    </Container>
  );
};

export default Dispense;
