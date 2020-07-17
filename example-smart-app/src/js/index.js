import * as React from "react";
import { render } from "react-dom";
import App from "./App";

(function(window){
  window.extractData = function() {
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      const rootElement = document.getElementById("root");

      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;

        var {pt, medications, conditions} = retrieveData(smart, patient);

        $.when(pt, medications, conditions).fail(onError);

        $.when(pt, medications, conditions).done(
          function(patient, medications, conditions) {
            render(<App patient={patient} meds={medications} conditions={conditions} />, rootElement);
          }
        );
      } else {
        onError();
      }
    }

    function retrieveData(smart, patient) {
      var pt = patient.read();
      // var obv = smart.patient.api.fetchAll({
      //             type: 'Observation',
      //             query: {
      //               code: {
      //                 $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
      //                       'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
      //                       'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
      //               }
      //             }
      //           });
      var conditions = smart.patient.api.fetchAll({
        type: 'Condition',
      })
      // var carePlan = smart.patient.api.fetchAll({
      //   type: 'CarePlan',
      // })
      var medications = smart.patient.api.fetchAll({
        type: 'MedicationRequest',
      })
      return {pt, medications, conditions};
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };
})(window);
