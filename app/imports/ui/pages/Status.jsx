import React from 'react';
import { Container, Tab, Menu } from 'semantic-ui-react';
import { PAGE_IDS } from '../utilities/PageIDs';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import DrugStatus from '../components/inventory-status/DrugStatus';
import SupplyStatus from '../components/inventory-status/SupplyStatus';
import VaccineStatus from '../components/inventory-status/VaccineStatus';

const medicationTab = () => <DrugStatus />;
const vaccinesTab = () => <VaccineStatus />;
const suppliesTab = () => <SupplyStatus />;

const panes = [
  {
    menuItem: <Menu.Item key={COMPONENT_IDS.STATUS_TAB_ONE} id={COMPONENT_IDS.STATUS_TAB_ONE}>Drugs</Menu.Item>,
    render: medicationTab,
  },
  {
    menuItem: <Menu.Item key={COMPONENT_IDS.STATUS_TAB_TWO} id={COMPONENT_IDS.STATUS_TAB_TWO}>Vaccines</Menu.Item>,
    render: vaccinesTab,
  },
  {
    menuItem: <Menu.Item key={COMPONENT_IDS.STATUS_TAB_THREE} id={COMPONENT_IDS.STATUS_TAB_THREE}>Supplies</Menu.Item>,
    render: suppliesTab,
  },
];

const Status = () => (
  <div className='status-wrapped'>
    <Container id={PAGE_IDS.STATUS}>
      <Tab panes={panes}/>
    </Container>
  </div>
);

export default Status;
