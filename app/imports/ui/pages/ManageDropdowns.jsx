import React from 'react';
import { Container, Tab, Segment } from 'semantic-ui-react';
import { PAGE_IDS } from '../utilities/PageIDs';
// import ManageDrugTypes from '../components/manage-dropdowns/ManageDrugTypes';
// import ManageLocations from '../components/manage-dropdowns/ManageLocations';
// import ManageSites from '../components/manage-dropdowns/ManageSites';
import { DrugTypes } from '../../api/drugType/DrugTypeCollection';
import { Locations } from '../../api/location/LocationCollection';
import { Sites } from '../../api/site/SiteCollection';
import ManageSingle from '../components/manage-dropdowns/ManageSingle';


// const drugTypesTab = () => <ManageDrugTypes />;
const drugTypesTab = () => <ManageSingle collection={DrugTypes} title={"Drug Types"} name={"drugType"} />;
const locationsTab = () => <ManageSingle collection={Locations} title={"Locations"} name={"location"} />;
const sitesTab = () => <ManageSingle collection={Sites} title={"Sites"} name={"site"} />;

const panes = [
  { menuItem: 'Drug Types', render: drugTypesTab },
  { menuItem: 'Locations', render: locationsTab },
  { menuItem: 'Sites', render: sitesTab },
];

const ManageDropdowns = () => (
  <Container id={PAGE_IDS.MANAGE_DROPDOWNS}>
    <Segment>
      <Tab menu={{ fluid: true, vertical: true, tabular: true, padding: 0 }} panes={panes} />
    </Segment>
  </Container>
);

export default ManageDropdowns;
