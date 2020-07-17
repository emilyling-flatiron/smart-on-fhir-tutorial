(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;

        var {pt, obv, conditions, carePlan, medications} = retrieveData(smart, patient);

        $.when(pt, obv, conditions, carePlan, medications).fail(onError);

        $.when(pt, obv, conditions, carePlan, medications).done(function(patient, obv, conditions, carePlan) {
          processData(smart, patient, pt, obv, conditions, carePlan, medications)
        });
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
      })src/js/example-smart-app.js
      var carePlan = smart.patient.api.fetchAll({
        type: 'CarePlan',
      })
      var medications = smart.patient.api.fetchAll({
        type: 'Medication',
      })
      return {pt, obv, conditions, carePlan, medications};
    }

    function processData(smart, patient, pt, obv, conditions, carePlan, medications) {
      var byCodes = smart.byCodes(obv, 'code');
      var gender = patient.gender;

      var fname = '';
      var lname = '';

      if (typeof patient.name[0] !== 'undefined') {
        fname = patient.name[0].given.join(' ');
        lname = patient.name[0].family.join(' ');
      }

      var height = byCodes('8302-2');
      var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
      var hdl = byCodes('2085-9');
      var ldl = byCodes('2089-1');

      var p = defaultPatient();
      p.birthdate = patient.birthDate;
      p.gender = gender;
      p.fname = fname;
      p.lname = lname;
      p.height = getQuantityValueAndUnit(height[0]);

      if (typeof systolicbp != 'undefined')  {
        p.systolicbp = systolicbp;
      }

      if (typeof diastolicbp != 'undefined') {
        p.diastolicbp = diastolicbp;
      }

      p.hdl = getQuantityValueAndUnit(hdl[0]);
      p.ldl = getQuantityValueAndUnit(ldl[0]);

      processConditions(conditions);
      processCarePlan(carePlan);
      processMedications(medications);

      ret.resolve(p);
    }

    function processConditions(conditions) {
      console.log(conditions);

      var conditionsDiv = $('#conditions');
      var conditionsTable = $('<table>');
      conditionsTable.append('<tr><th>Condition</th><th>Code</th><th>Onset</th><th>Status</th></tr>');
      conditions.forEach(element => {
        var tr = $('<tr>');
        tr.append('<th>' + element.code.text + '</th>');
        tr.append('<td>' + element.code.coding[0] .code + '</td>');
        tr.append('<td>' + element.onsetDateTime.toString() + '</td>');
        tr.append('<td>' + element.clinicalStatus + '</td>');
        conditionsTable.append(tr);
      });
      if (conditions.length > 0) {
        conditionsDiv.append('<h2>Conditions</h2>')
        conditionsDiv.append(conditionsTable);
      }
    }

    function processCarePlan(carePlan) {
      console.log(carePlan);

      var carePlanDiv = $('#careplan');
      var carePlanTable = $('<table>');
      carePlanTable.append('<tr><th>Activity</th><th>Status</th><th>Category</th><th>Start</th><th>End</th></tr>');
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
      if (carePlan.length > 0) {
        carePlanDiv.append('<h2>Care Plan</h2>')
        carePlanDiv.append(carePlanTable);
      }
    }

    function processMedications(medications) {
      console.log(medications);
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
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
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
  };

})(window);
