// copy from https://developer.webex.com/docs/integrations#scopes
// probably needs updating from time to time
const scopeText = `
meeting:schedules_read
Retrieve your Webex meeting lists and details
meeting:schedules_write
Create, manage, or cancel your scheduled Webex meetings
meeting:recordings_read
Retrieve your Webex meeting recordings for playback
meeting:recordings_write
Manage or delete your meeting recordings for playback
meeting:preferences_read
Retrieve your Webex meeting preferences
meeting:preferences_write
Edit your Webex meeting preferences
meeting:controls_read
Read meeting control information for in-progress meetings
meeting:controls_write
Update meeting controls for in-progress meetings
meeting:participants_read
Read participant information from meetings
meeting:participants_write
Manage participants within meetings
meeting:admin_participants_read
Read participant information from meetings for all WebEx users of your organization
spark-admin:telephony_config_read
Read and list telephony configuration
spark-admin:telephony_config_write
Create, edit and delete telephony configuration
meeting:admin_schedule_read
Retrieve meetings of all WebEx users of your organization
meeting:admin_schedule_write
Create, manage, or cancel meetings of all WebEx users of your organization
meeting:admin_recordings_read
Retrieve recordings of all WebEx users of your organization
meeting:admin_recordings_write
Manage or delete recordings of all WebEx users of your organization
meeting:admin_transcripts_read
Retrieve Webex meetings transcripts of all WebEx users of your organization
meeting:admin_preferences_write
Manage meeting preferences of all WebEx users of your organization
meeting:admin_preferences_read
Retrieve Webex meeting preferences of all WebEx users of your organization
spark-compliance:meetings_read
Access to read recording and transcript resources in your user’s organization.
meeting:transcripts_read
Retrieve your Webex meetings transcripts
spark-compliance:meetings_write
Access to update/delete recordings and transcripts in your user’s organization.
spark-admin:workspace_locations_read
See details for your workspace locations
spark-admin:workspace_locations_write
Create, modify and delete your workspace locations
spark-admin:workspace_metrics_read
See metrics for your workspaces
spark:all
Full access to your Webex account
spark:calls_read
List all calls for rooms you are a part of
spark:devices_read
See details for your devices
spark:devices_write
Modify and delete your devices
spark:memberships_read
List people in the rooms you are in
spark:memberships_write
Invite people to rooms on your behalf
spark:messages_read
Read the content of rooms that you are in
spark:messages_write
Post and delete messages on your behalf
spark:organizations_read
Access to read your user's organizations
spark:people_read
Read your users' company directory
spark:places_read
See details for places and place services you manage
spark:places_write
Create, modify and delete places and place services you manage
spark:rooms_read
List the titles of rooms that you are in
spark:rooms_write
Manage rooms on your behalf
spark:team_memberships_read
List the people in the teams your user belongs to
spark:team_memberships_write
Add people to teams on your users' behalf
spark:teams_read
List the teams your user's a member of
spark:teams_write
Create teams on your users' behalf
spark:xapi_statuses
Retrieve all information from RoomOS-enabled devices.
spark:xapi_commands
Execute all commands on RoomOS-enabled devices.
spark-admin:devices_read
See details for any device in your organization
spark-admin:devices_write
Create, update and delete devices and device configurations in your organization
spark-admin:licenses_read
Access to read licenses available in your user's organizations
spark-admin:organizations_read
Access to read your user's organizations
spark-admin:people_read
Access to read your user's company directory
spark-admin:people_write
Access to write to your user's company directory
spark-admin:places_read
See details for any places and place service in your organization
spark-admin:places_write
Create, update and delete any place and place service in your organization
spark-admin:resource_group_memberships_read
Access to read your organization's resource group memberships
spark-admin:resource_group_memberships_write
Access to update your organization's resource group memberships
spark-admin:resource_groups_read
Access to read your organization's resource groups
spark-admin:roles_read
Access to read roles available in your user's organization
spark-admin:call_qualities_read
Access to read organization's call qualities
spark-compliance:events_read
Access to read events in your user's organization
spark-compliance:memberships_read
Access to read memberships in your user's organization
spark-compliance:memberships_write
Access to create/update/delete memberships in your user's organization
spark-compliance:messages_read
Access to read messages in your user's organization
spark-compliance:messages_write
Post and delete messages in all spaces in your user's organization
spark-compliance:rooms_read
Access to read rooms in your user's organization
spark-compliance:rooms_write
Access to modify rooms in your user's organization
spark-compliance:team_memberships_read
Access to read team memberships in your user's organization
spark-compliance:team_memberships_write
Access to update team memberships in your user's organization
spark-compliance:teams_read
Access to read teams in your user's organization
spark-admin:broadworks_enterprises_read
Read or List BroadWorks Enterprise, provisioned as part of Webex for BroadWorks Solution.
identity:placeonetimepassword_create
Access to a one time password to a place to create an activation code
Identity:one_time_password
Request a one time password for people, devices, and things.
spark-compliance:webhooks_write
Delete org wide webhooks
spark-compliance:webhooks_read
Inspect org wide webhooks
spark:calls_write
Allow users to invoke call commands on themselves
spark-admin:wholesale_billing_reports_read
Read or List Wholesale Billing Reports associated with a Partner, subscribed to Webex for Wholesale solution.
spark-admin:hybrid_clusters_read
Access to read hybrid clusters for your organization
spark-admin:wholesale_billing_reports_write
Create or Delete Wholesale Billing Reports associated with a Partner, subscribed to Webex for Wholesale solution.
spark-admin:hybrid_connectors_read
Access to read hybrid connectors for your organization
spark-admin:broadworks_subscribers_read
Read or List BroadWorks Subscribers, provisioned as part of Webex for BroadWorks Solution.
spark-admin:broadworks_subscribers_write
Provision, Update or Remove a BroadWorks Subscriber as part of Webex for BroadWorks Solution.
audit:events_read
Access to the audit log for an organization
spark-admin:wholesale_customers_write
Provision, Update or Remove a Customer as part of Webex Wholesale Solution.
spark-admin:wholesale_customers_read
Read or List Customers, provisioned as part of Webex Wholesale Solution.
spark-admin:wholesale_subscribers_write
Provision, Update or Remove a Subscriber as part of Webex Wholesale Solution.
spark-admin:wholesale_subscribers_read
Read or List Subscribers, provisioned as part of Webex Wholesale Solution.
identity:groups_rw
Read Write groups
identity:groups_read
Read group
spark-admin:locations_write
Create and edit location configuration.
identity:tokens_read
Admin can list token Ids for a user
identity:tokens_write
Admin can delete token for a user
meeting:admin_config_read
Retrieve Webex meeting configurations as an administrator
meeting:admin_config_write
Manage Webex meeting configurations as an administrator
spark-admin:locations_read
Read and list location configuration.
spark-admin:broadworks_enterprises_write
Change BroadWorks Enterprise configuration, provisioned as part of Webex for BroadWorks Solution.
`;

function getScopes() {
  const res = [];
  const list = scopeText.trim().split('\n');
  for (let n = 0; n < list.length; n += 2) {
    res.push({ id: list[n], info: list[n + 1] });
  }

  // sort devices before the rest
  const relevant = i => {
    const str = i.info.toLowerCase();
    return str.includes('device') || str.includes('workspace');
  }
  const devices = res.filter(relevant);
  const nondevices  = res.filter(i => !relevant(i));
  nondevices.sort((i1, i2) => i1.id < i2.id ? -1 : 1);

  return devices.concat(nondevices);
}

// from control hub > workspaces > integrations > webhooks
const allowedEvents = [
  'BootEvent',
  'CallDisconnect',
  'CallSuccessful',
  'UserInterface.Assistant.Notification',
  'UserInterface.Extensions.Panel.Clicked',
  'UserInterface.Extensions.Widget.Action',
  'UserInterface.Message.Prompt.Response',
  'UserInterface.Message.Rating.Response',
  'UserInterface.Message.TextInput.Response',
];

const allowedStatus = [
  'Conference Presentation LocalInstance SendingMode',
  'RoomAnalytics Engagement CloseProximity',
  'RoomAnalytics PeopleCount Current',
  'RoomAnalytics PeoplePresence',
  'Standby State',
  'SystemUnit State NumberOfActiveCalls',
];
