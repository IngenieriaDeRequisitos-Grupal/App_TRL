from unittest.mock import patch
from uuid import uuid4

from django.test import SimpleTestCase
from django.conf import settings
from django.urls import reverse


class FrontendIntegrationViewsTests(SimpleTestCase):
    def set_session(self, values):
        session = self.client.session
        session.update(values)
        session.save()
        self.client.cookies[settings.SESSION_COOKIE_NAME] = session.session_key

    @patch('TRL_APP.views.request_api')
    def test_login_stores_mfa_ticket_without_exposing_it_in_url(self, api):
        api.return_value = {'mfa_ticket': 'ticket-seguro-de-prueba'}
        response = self.client.post(reverse('login'), {
            'correo_electronico': 'admin@trl.local',
            'contrasena': 'una-contrasena-segura',
        })
        self.assertRedirects(response, reverse('mfa_verify'), fetch_redirect_response=False)
        self.assertEqual(self.client.session['mfa_ticket'], 'ticket-seguro-de-prueba')
        self.assertNotIn('ticket=', response.url)

    @patch('TRL_APP.views.request_api')
    def test_mfa_stores_access_token_and_user(self, api):
        self.set_session({'mfa_ticket': 'ticket-seguro-de-prueba'})
        api.side_effect = [
            {'access_token': 'jwt-de-prueba'},
            {'id_usuario': str(uuid4()), 'correo_electronico': 'admin@trl.local', 'rol': 'ADMINISTRADOR'},
            [{'tipo': 'TERMINOS_USO', 'aceptado': True}, {'tipo': 'AVISO_PRIVACIDAD', 'aceptado': True}],
        ]
        response = self.client.post(reverse('mfa_verify'), {'codigo': '123456'})
        self.assertRedirects(response, reverse('listado_proyectos'), fetch_redirect_response=False)
        self.assertEqual(self.client.session['access_token'], 'jwt-de-prueba')
        self.assertEqual(self.client.session['user']['rol'], 'ADMINISTRADOR')

    @patch('TRL_APP.views.request_api')
    def test_projects_page_consumes_paginated_backend_response(self, api):
        self.set_session({
            'access_token': 'jwt-de-prueba',
            'user': {'rol': 'INVESTIGADOR', 'correo_electronico': 'investigador@trl.local'},
        })
        project_id = str(uuid4())
        api.side_effect = [
            {'data': [{'id_proyecto': project_id, 'titulo_tecnologia': 'Proyecto real', 'rama_innovacion': 'Software', 'nivel_trl_actual': None}]},
            [],
        ]
        response = self.client.get(reverse('listado_proyectos'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Proyecto real')
