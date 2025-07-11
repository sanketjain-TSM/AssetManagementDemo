import Oximeters from "../../assets/images/Oximeters.png";
import Warming from "../../assets/images/Warming_Units.png";
import Circulatory from "../../assets/images/Circulatory_Assist_SCD.png";
import Enteral from "../../assets/images/Enteral_Feeding.png";
import Vital from "../../assets/images/VitalSigns.png";
import Telemetry from "../../assets/images/Telemetry_Box.png";
import Peripheral from "../../assets/images/Peripheral.png";
import Ultrasound_Surgical_Units from "../../assets/images/Ultrasound_Surgical_Units.png";
import Hypo_Hyperthermia from "../../assets/images/Hypo_Hyperthermia.png";
import Endoscopes from "../../assets/images/Endoscopes.png";
import PhysiologicMonitorModule from "../../assets/images/PhysiologicMonitorModule.png";
import Blood from "../../assets/images/Blood.png";
import Paraffin from "../../assets/images/Paraffin.png";
import Central_Station from "../../assets/images/Central_Station.png";
import VitalSigns from "../../assets/images/VitalSigns.png";

const ImagesEnum = Object.freeze({
  "Oximeters, Pulse": Oximeters,
  "Warming Units, Blood/Solution": Warming,
  "Circulatory Assist,SCD": Circulatory,
  "Pumps, Enteral Feeding": Enteral,
  "Monitors, Vital Signs": Vital,
  "Telemetry Box": Telemetry,
  "Circulatory Assist, Peripheral, SCD": Peripheral,
  "Ultrasound Units": Ultrasound_Surgical_Units,
  "Ultrasound Surgical Units": Ultrasound_Surgical_Units,
  "Infusion Pumps": Blood,
  "Hypo/Hyperthermia": Hypo_Hyperthermia,
  "Endoscopes, CMAC": Endoscopes,
  "PhysiologicMonitorModule,Multi": PhysiologicMonitorModule,
  "Infusion Pumps, BLOOD": Blood,
  "Baths, Paraffin": Paraffin,
  "Monitors, Central Station": Central_Station,
  "Monitors,VitalSigns": VitalSigns,
  // UNKNOWN: VitalSigns,
});

export default ImagesEnum;
