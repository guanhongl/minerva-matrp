import React from 'react';
import { Container, Tab, Segment } from 'semantic-ui-react';
import { PAGE_IDS } from '../utilities/PageIDs';
// import ManageDrugTypes from '../components/manage-dropdowns/ManageDrugTypes';
// import ManageLocations from '../components/manage-dropdowns/ManageLocations';
// import ManageSites from '../components/manage-dropdowns/ManageSites';
import { DrugNames } from '../../api/drugName/DrugNameCollection';
import { DrugTypes } from '../../api/drugType/DrugTypeCollection';
import { Units } from '../../api/unit/UnitCollection';
import { DrugBrands } from '../../api/drugBrand/DrugBrandCollection';
import { VaccineNames } from '../../api/vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../../api/vaccineBrand/VaccineBrandCollection';
import { SupplyNames } from '../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../api/location/LocationCollection';
import { Sites } from '../../api/site/SiteCollection';
import ManageSingle from '../components/manage-dropdowns/ManageSingle';

const drugNamesTab = () => <ManageSingle collection={DrugNames} title={"Drug Names"} name={"drugName"} />;
const drugTypesTab = () => <ManageSingle collection={DrugTypes} title={"Drug Types"} name={"drugType"} />;
const unitsTab = () => <ManageSingle collection={Units} title={"Units"} name={"unit"} />;
const drugBrandsTab = () => <ManageSingle collection={DrugBrands} title={"Drug Brands"} name={"drugBrand"} />;
const vaccineNamesTab = () => <ManageSingle collection={VaccineNames} title={"Vaccine Names"} name={"vaccineName"} />;
const vaccineBrandsTab = () => <ManageSingle collection={VaccineBrands} title={"Vaccine Brands"} name={"vaccineBrand"} />;
const supplyNamesTab = () => <ManageSingle collection={SupplyNames} title={"Supply Names"} name={"supplyName"} />;
const locationsTab = () => <ManageSingle collection={Locations} title={"Locations"} name={"location"} />;
const sitesTab = () => <ManageSingle collection={Sites} title={"Sites"} name={"site"} />;

const panes = [
  { menuItem: 'Drug Names', render: drugNamesTab },
  { menuItem: 'Drug Types', render: drugTypesTab },
  { menuItem: 'Units', render: unitsTab },
  { menuItem: 'Drug Brands', render: drugBrandsTab },
  { menuItem: 'Vaccine Names', render: vaccineNamesTab },
  { menuItem: 'Vaccine Brands', render: vaccineBrandsTab },
  { menuItem: 'Supply Names', render: supplyNamesTab },
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
