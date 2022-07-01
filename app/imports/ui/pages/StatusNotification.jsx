import React from 'react';
import { Loader, Label, Icon, Popup } from 'semantic-ui-react';
import { useTracker } from 'meteor/react-meteor-data';
import { _ } from 'meteor/underscore';
import { Drugs } from '../../api/drug/DrugCollection';
import { COMPONENT_IDS } from '../utilities/ComponentIDs';
import { fetchCounts } from '../utilities/Functions';

// Render the form.
const StatusNotification = () => {
  // monitor low stock and no stock
  const { drugsL, drugsN, ready } = useTracker(() => {
    const drugsHandle = Drugs.subscribeDrugStock();

    if (!drugsHandle.ready()) {
      return { drugsL: 0, drugsN: 0, ready: false };
    }

    const drugs = Drugs.find().fetch();
    const [drugsL, drugsN] = fetchCounts(drugs);
    return { drugsL, drugsN, ready: true };
  });

  if (ready) {
    return (
      <Popup
        trigger={
          <div id={COMPONENT_IDS.STATUS_NOTIFICATION}>
            <Icon name='announcement'/>
            <Label color='red' floating>
              {drugsL + drugsN}
            </Label>
          </div>
        } 
      >
        <Popup.Header>Notifications</Popup.Header>
        <Popup.Content>
          <div>
            <Icon color='yellow' name='warning circle'/>
            <span>{drugsL} Low Stock</span>
          </div>
          <div>
            <Icon color='red' name='warning circle'/>
            <span>{drugsN} Out of Stock</span>
          </div>
        </Popup.Content>
      </Popup>
    );
  }
  return (<Loader active />);
};

export default StatusNotification;
