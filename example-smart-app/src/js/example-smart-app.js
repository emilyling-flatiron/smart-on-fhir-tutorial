(function(window) {
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart) {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;

        var {pt, obv, conditions, carePlan, medications} = retrieveData(smart, patient);

        $.when(pt, obv, conditions, carePlan, medications).fail(onError);

        $.when(pt, obv, conditions, carePlan, medications).done(
          function(patient, obv, conditions, carePlan, medications) {
            processData(smart, patient, pt, obv, conditions, carePlan, medications)
          }
        );
      } else {
        onError();
      }
	
      if (smart.hasOwnProperty('user')) {
        var practitioner = smart.user;

        var {pr, contact} = retrievePractitionerData(smart, practitioner);

        $.when(pr, contact).fail(onError);

        $.when(pr, contact).done(
          function(practitioner, contact) {
            processPractitionerData(smart, practitioner, pr, contact)
          }
        );
      } else {
        onError();
      }
    }

    function retrieveData(smart, patient) {
      var pt = patient.read();
      var obv = smart.patient.api.fetchAll({
                  type: 'Observation',
                  query: {
                    code: {
                      $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                            'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                            'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                    }
                  }
                });
      var conditions = smart.patient.api.fetchAll({
        type: 'Condition',
      })
      var carePlan = smart.patient.api.fetchAll({
        type: 'CarePlan',
      })
      var medications = smart.patient.api.fetchAll({
        type: 'Medication',
      })
      return {pt, obv, conditions, carePlan, medications};
    }
      
    function retrievePractitionerData(smart, practitioner) {
      var pr = practitioner.read();
     
      var contact= "dummy for now";
      return {pr, contact};
    }

    function processPractitionerData(smart, practitioner, pr, contact) {
      contact = practitioner.telecom;
      var fname = '';
      var lname = '';

      if (typeof practitioner.name[0] !== 'undefined') {
        fname = practitioner.name[0].given.join(' ');
        lname = practitioner.name[0].family.join(' ');
      }

      var p = defaultPractitioner();
      p.fname = fname;
      p.lname = lname;

      ret.resolve(p);
    }

    function processData(smart, patient, pt, obv, conditions, carePlan, medications) {      
      processPatient(smart, patient);
      processConditions(conditions);
      processCarePlan(carePlan);
      processMedications(medications);
    }

    function processPatient(smart, patient) {
      console.log(patient);

      var byCodes = smart.byCodes(obv, 'code');
      var gender = patient.gender;

      var fname = '';
      var lname = '';

      if (typeof patient.name[0] !== 'undefined') {
        fname = patient.name[0].given.join(' ');
        lname = patient.name[0].family.join(' ');
      }

      var height = byCodes('8302-2');
      var location = patient.address[0].city + ", " + patient.address[0].state + " (zip code: " + patient.address[0].postalCode + ")"
    
      var div = $('#patients');
      var table = $('<table class="table table-hover">');
      table.append('<tbody>');
      table.append('<tr><th>' + "First Name" + '</th><td>' + fname + '</td></tr>');
      table.append('<tr><th>' + "Last Name" + '</th><td>' + lname + '</td></tr>');
      table.append('<tr><th>' + "Gender" + '</th><td>' + gender + '</td></tr>');
      table.append('<tr><th>' + "Birth Date" + '</th><td>' + patient.birthDate + '</td></tr>');
      table.append('<tr><th>' + "Location" + '</th><td>' + location + '</td></tr>');
      table.append('<tr><th>' + "Height" + '</th><td>' + getQuantityValueAndUnit(height[0]) + '</td></tr>');
      table.append('</tbody>');

      div.append('<h2>Patient Information</h2>')
      div.append(table);
    }

    function processConditions(conditions) {
      console.log(conditions);

      var conditionsDiv = $('#conditions');
      var conditionsTable = $('<table class="table table-hover">');
      conditionsTable.append('<thead><tr><th>Condition</th><th>Code</th><th>Onset</th><th>Status</th></tr></thead>');
      conditionsTable.append('<tbody>');
      conditions.forEach(element => {
        var tr = $('<tr>');
        tr.append('<th>' + element.code.text + '</th>');
        tr.append('<td>' + element.code.coding[0].code + '</td>');
        tr.append('<td>' + element.onsetDateTime.toString() + '</td>');
        tr.append('<td>' + element.clinicalStatus + '</td>');
        conditionsTable.append(tr);
      });
      conditionsTable.append('</tbody>');
      if (conditions.length > 0) {
        conditionsDiv.append('<h2>Conditions</h2>')
        conditionsDiv.append(conditionsTable);
      }
    }

    function processCarePlan(carePlan) {
      console.log(carePlan);

      var carePlanDiv = $('#careplan');
      var carePlanTable = $('<table class="table table-hover">');
      carePlanTable.append('<thead><tr><th>Activity</th><th>Status</th><th>Category</th><th>Start</th><th>End</th></tr></thead>');
      carePlanTable.append('<tbody>');
      carePlan.forEach(element => {
        console.log(element);
        element.activity.forEach(activity => {
          console.log(activity);
          var tr = $('<tr>');
          tr.append('<th>' + activity.detail.code.coding[0].display + '</th>');
          tr.append('<td>' + activity.detail.status + '</td>');
          tr.append('<td>' + element.category[0].coding[0].display + '</td>');
          tr.append('<td>' + element.period.start + '</td>');
          tr.append('<td>' + element.period.end + '</td>');
          carePlanTable.append(tr);
        });
      });
      carePlanTable.append('</tbody>');
      if (carePlan.length > 0) {
        carePlanDiv.append('<h2>Care Plan</h2>')
        carePlanDiv.append(carePlanTable);
      }
    }

    function processMedications(medications) {
      console.log(medications);
      var medicationsDiv = $('#medications');
      var medicationsTable = $('<table class="table table-hover">');
      medicationsTable.append('<thead><tr><th>Medication</th><th>Last Updated</th></tr></thead>');
      medicationsTable.append('<tbody>');
      medications.forEach(element => {
        var tr = $('<tr>');
        tr.append('<th>' + element.code.text + '</th>');
        tr.append('<td>' + element.meta.lastUpdated.toString() + '</td>');
        medicationsTable.append(tr);
      });
      medicationsTable.append('</tbody>');
      if (medications.length > 0) {
        medicationsDiv.append('<h2>Medications</h2>')
        medicationsDiv.append(medicationsTable);
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPractitioner(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      email: {value: ''},
      contact:{value: ''}
	
    };
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
  };

})(window);
