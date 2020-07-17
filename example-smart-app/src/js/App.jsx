import * as React from "react";
import { getPath } from "fhirclient/lib/lib";

const rxnorm = "http://www.nlm.nih.gov/research/umls/rxnorm";

function getMedicationName(medCodings = []) {
    let out = "Unnamed Medication(TM)";
    const coding = medCodings.find(c => c.system === rxnorm);
    if (coding && coding.display) {
        out = coding.display;
    }
    return out;
}

function PatientName({ name = [] }) {
    let entry =
        name.find(nameRecord => nameRecord.use === "official") || name[0];
    if (!entry) {
        return <h1>No Name</h1>;
    }
    return <h1>{entry.given.join(" ") + " " + entry.family}</h1>;
}

function PatientBanner(patient) {
    return (
        <div>
            <PatientName name={patient.name} />
            <span>
                Gender: <b>{patient.gender}</b>,{" "}
            </span>
            <span>
                DOB: <b>{patient.birthDate}</b>{', '}
            </span>
            <span>
                Location: <b>{patient.address[0].city}, {patient.address[0].state}</b>
            </span>
        </div>
    );
}

function MedRow({ med }) {
    const name = getMedicationName(
        getPath(med, "medicationCodeableConcept.coding") ||
            getPath(med, "medicationReference.code.coding")
    );
    return (
        <tr>
            <td>
                <b>{name}</b>
            </td>
            <td>{med.status || "-"}</td>
            <td>{med.intent || "-"}</td>
            <td>{getPath(med, "dosageInstruction.0.text") || "-"}</td>
        </tr>
    );
}

function ConditionRow({ condition }) {
    return (
        <tr>
            <td>
                <b>{condition.code.text}</b>
            </td>
            <td>{condition.code.coding[0].code}</td>
            <td>{condition.onsetDateTime || "-"}</td>
        </tr>
    );
}

function App({ patient, meds, conditions }) {
    return (
        <div className="App">
            <PatientBanner {...patient} />
            <hr />
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>Medication</th>
                        <th>Status</th>
                        <th>Intent</th>
                        <th>Dosage Instruction</th>
                    </tr>
                </thead>
                <tbody>
                    {meds.map(med => (
                        <MedRow key={med.id} med={med} />
                    ))}
                </tbody>
            </table>
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th>Condition</th>
                        <th>Code</th>
                        <th>Onset</th>
                    </tr>
                </thead>
                <tbody>
                    {conditions.map(condition => (
                        <ConditionRow key={condition.id} condition={condition} />
                    ))}
                </tbody>
            </table>
            {/* <pre>{ JSON.stringify(conditions, null, 4) }</pre> */}
        </div>
    );
}

export default App;