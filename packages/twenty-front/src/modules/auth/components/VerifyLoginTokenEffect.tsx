import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useHasAccessTokenPair } from '@/auth/hooks/useHasAccessTokenPair';
import { useVerifyLogin } from '@/auth/hooks/useVerifyLogin';
import { SubTitle } from '@/auth/components/SubTitle';
import { Title } from '@/auth/components/Title';
import { clientConfigApiStatusState } from '@/client-config/states/clientConfigApiStatusState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { AppPath } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { useNavigateApp } from '~/hooks/useNavigateApp';

const VERIFY_TIMEOUT_MS = 15_000;

export const VerifyLoginTokenEffect = () => {
  const [searchParams] = useSearchParams();
  const loginToken = searchParams.get('loginToken');
  const { t } = useLingui();

  const hasAccessTokenPair = useHasAccessTokenPair();
  const navigate = useNavigateApp();
  const { verifyLoginToken } = useVerifyLogin();

  const { isSaved: clientConfigLoaded } = useAtomStateValue(
    clientConfigApiStatusState,
  );

  useEffect(() => {
    if (!clientConfigLoaded) {
      return;
    }

    if (isDefined(loginToken)) {
      verifyLoginToken(loginToken);
    } else if (!hasAccessTokenPair) {
      navigate(AppPath.SignInUp);
    }
    // Verify only needs to run once at mount
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [clientConfigLoaded]);

  // Safety fallback: if verification hangs, redirect to sign-in after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(AppPath.SignInUp);
    }, VERIFY_TIMEOUT_MS);

    return () => clearTimeout(timer);
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Title animate>{t`Signing you in`}</Title>
      <SubTitle>{t`Please wait a moment...`}</SubTitle>
    </>
  );
};
