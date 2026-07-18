import { ICoworkerQuestionnaireInsuranceData } from '../../interfaces/i-coworker-questionnaire';
import {
  QuestionnaireDisabilityDegree,
  QuestionnaireJoinDeclineAnswer,
  QuestionnaireYesNo,
} from '../../types/coworker-questionnaire';
import {
  readEdgeNullableBoolean,
  readEdgeNullableLiteral,
  readEdgeNullableString,
  readEdgeObject,
} from '../../utils/edge-contract';

const YES_NO_VALUES: readonly Exclude<QuestionnaireYesNo, null>[] = [
  'yes',
  'no',
];
const JOIN_DECLINE_VALUES: readonly Exclude<
  QuestionnaireJoinDeclineAnswer,
  null
>[] = ['join', 'decline'];
const DISABILITY_DEGREE_VALUES: readonly Exclude<
  QuestionnaireDisabilityDegree,
  null
>[] = ['none', 'light', 'moderate', 'severe'];

export function parseQuestionnaireInsurance(
  value: unknown,
): ICoworkerQuestionnaireInsuranceData {
  const path = 'data.insurance';
  const insurance = readEdgeObject(value, path);

  return {
    otherEmployment: answer(insurance['otherEmployment'], 'otherEmployment'),
    otherEmployerName: readEdgeNullableString(
      insurance['otherEmployerName'],
      `${path}.otherEmployerName`,
    ),
    otherEmploymentAtLeastMinimumWage: answer(
      insurance['otherEmploymentAtLeastMinimumWage'],
      'otherEmploymentAtLeastMinimumWage',
    ),
    studentUnder26: answer(insurance['studentUnder26'], 'studentUnder26'),
    schoolOrUniversityName: readEdgeNullableString(
      insurance['schoolOrUniversityName'],
      `${path}.schoolOrUniversityName`,
    ),
    otherMandateContract: answer(
      insurance['otherMandateContract'],
      'otherMandateContract',
    ),
    otherPrincipalName: readEdgeNullableString(
      insurance['otherPrincipalName'],
      `${path}.otherPrincipalName`,
    ),
    otherMandateContractSocialInsurance: answer(
      insurance['otherMandateContractSocialInsurance'],
      'otherMandateContractSocialInsurance',
    ),
    subjectToCompulsorySocialInsurance: answer(
      insurance['subjectToCompulsorySocialInsurance'],
      'subjectToCompulsorySocialInsurance',
    ),
    voluntarySicknessInsurance: readEdgeNullableLiteral(
      insurance['voluntarySicknessInsurance'],
      `${path}.voluntarySicknessInsurance`,
      JOIN_DECLINE_VALUES,
    ),
    voluntarySicknessInsuranceJoinConfirmed: readEdgeNullableBoolean(
      insurance['voluntarySicknessInsuranceJoinConfirmed'],
      `${path}.voluntarySicknessInsuranceJoinConfirmed`,
    ),
    voluntaryPensionDisabilityInsurance: readEdgeNullableLiteral(
      insurance['voluntaryPensionDisabilityInsurance'],
      `${path}.voluntaryPensionDisabilityInsurance`,
      JOIN_DECLINE_VALUES,
    ),
    hasPensionOrDisabilityPensionRight: answer(
      insurance['hasPensionOrDisabilityPensionRight'],
      'hasPensionOrDisabilityPensionRight',
    ),
    disabilityDegree: readEdgeNullableLiteral(
      insurance['disabilityDegree'],
      `${path}.disabilityDegree`,
      DISABILITY_DEGREE_VALUES,
    ),
    registeredAtEmploymentOffice: answer(
      insurance['registeredAtEmploymentOffice'],
      'registeredAtEmploymentOffice',
    ),
    employmentOfficeAddress: readEdgeNullableString(
      insurance['employmentOfficeAddress'],
      `${path}.employmentOfficeAddress`,
    ),
  };
}

function answer(value: unknown, field: string): QuestionnaireYesNo {
  return readEdgeNullableLiteral(
    value,
    `data.insurance.${field}`,
    YES_NO_VALUES,
  );
}
