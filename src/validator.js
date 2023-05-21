function validateConfig(config) {
  console.log('validate', config);
  const requireds = formFields.filter(f => f.required);
  const warnings = [];
  const errors = [];

  // check required fields
  requireds.forEach(field => {
    if (!config[field.id]) {
      errors.push({
        tab: 'General',
        field: field.id,
        text: `You need to provide a required field: ${field.id}`,
      });
    }
  });

  // check scopes vs xapis:
  const hasScope = name => config.apiAccess?.find(a => a.scope === name);
  const hasNonEmptyApi = type => config.xapiAccess?.[type].some(i => i.path?.length);

  if (hasScope('spark:xapi_statuses') && !hasNonEmptyApi('status')) {
    errors.push({
      tab: 'Scopes',
      field: 'spark:xapi_statuses',
      text: 'When requesting scope spark:xapi_statuses, you need to request at least one xStatus in the xAPI',
    });
  }

  if (hasScope('spark:xapi_commands') && !hasNonEmptyApi('commands')) {
    errors.push({
      tab: 'Scopes',
      field: 'spark:xapi_commands',
      text: 'When requesting scope sarp:xapi_xommands, you need to request at least one xCommand in the xAPI',
    });
  }

  // check xapis vs scopes
  if (hasNonEmptyApi('commands') && !hasScope('spark:xapi_commands')) {
    errors.push({
      tab: 'xAPI',
      field: 'commands',
      text: 'When requesting xCommands, you also need to request the spark:xapi_commands scope',
    })
  }

  if (hasNonEmptyApi('status') && !hasScope('spark:xapi_statuses')) {
    errors.push({
      tab: 'xAPI',
      field: 'status',
      text: 'When requesting xStatus, you also need to request the spark:xapi_statuses scope',
    })
  }


  return { errors, warnings };
}