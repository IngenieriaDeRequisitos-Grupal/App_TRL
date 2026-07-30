from unittest.mock import patch
from uuid import uuid4

from django.test import SimpleTestCase
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
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

    @patch('TRL_APP.views.request_api')
    def test_admin_creates_user_with_real_backend_route(self, api):
        self.set_session({
            'access_token': 'jwt-de-prueba',
            'user': {'rol': 'ADMINISTRADOR', 'correo_electronico': 'admin@trl.local'},
        })
        api.return_value = {
            'nombre_completo': 'Investigador Prueba',
            'correo_electronico': 'investigador.prueba@trl.local',
            'rol': 'INVESTIGADOR',
            'mfa_secret': 'SECRETO-DE-PRUEBA',
        }
        response = self.client.post(reverse('create_user'), {
            'nombre_completo': 'Investigador Prueba',
            'correo_electronico': 'investigador.prueba@trl.local',
            'cedula': '1100000001',
            'contrasena': 'Contrasena-Segura-2026',
            'rol': 'INVESTIGADOR',
            'especialidad_tecnica': '',
            'departamento': '',
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(api.call_args.args[:2], ('POST', '/usuarios'))
        self.assertContains(response, 'SECRETO-DE-PRUEBA')

    @patch('TRL_APP.views.request_api')
    def test_manager_can_load_assignable_evaluators(self, api):
        self.set_session({
            'access_token': 'jwt-de-prueba',
            'user': {'rol': 'GESTOR_IDI', 'correo_electronico': 'gestor@trl.local'},
        })
        evaluator_id = str(uuid4())
        api.side_effect = [
            {'data': [{'id_usuario': evaluator_id, 'nombre_completo': 'Evaluador', 'correo_electronico': 'evaluador@trl.local', 'rol': 'EVALUADOR', 'estado': 'ACTIVO'}]},
            [],
        ]
        response = self.client.get(reverse('solicitudes'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Solicitudes de evaluación')

    def test_investigator_cannot_open_administrator_users_page(self):
        self.set_session({
            'access_token': 'jwt-de-prueba',
            'user': {'rol': 'INVESTIGADOR', 'correo_electronico': 'investigador@trl.local'},
        })
        response = self.client.get(reverse('usuarios'))
        self.assertEqual(response.status_code, 403)

    @patch('TRL_APP.views.request_api')
    def test_target_level_questions_and_pdf_are_saved_together(self, api):
        self.set_session({
            'access_token': 'jwt-de-prueba',
            'user': {'rol': 'INVESTIGADOR', 'correo_electronico': 'investigador@trl.local'},
        })
        project_id = uuid4()
        request_id = str(uuid4())
        questionnaire_id = str(uuid4())
        api.side_effect = [
            [],
            [],
            {'id_solicitud': request_id, 'cuestionario': {'id_cuestionario': questionnaire_id}},
            {'id_solicitud': request_id, 'nivel_estimado': 1},
            {'id_documento': str(uuid4())},
        ]
        response = self.client.post(reverse('evaluar_trl', args=[project_id]), {
            'nivel_objetivo': '1',
            'gen_01_a': 'cumple',
            'gen_01_b': 'cumple',
            'gen_01_c': 'cumple',
            'evidencia_pdf': SimpleUploadedFile(
                'evidencia.pdf',
                b'%PDF-1.4\n%%EOF',
                content_type='application/pdf',
            ),
        })
        self.assertRedirects(response, reverse('tabla_evidencias', args=[project_id]), fetch_redirect_response=False)
        self.assertEqual(api.call_args_list[3].args[:2], ('PUT', f'/evaluations/{request_id}/answers'))
        self.assertEqual(api.call_args_list[3].kwargs['json']['respuestas']['_nivel_objetivo'], 1)
        self.assertEqual(api.call_args_list[4].args[:2], ('POST', f'/evidence/questionnaires/{questionnaire_id}'))
