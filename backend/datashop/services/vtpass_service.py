"""
VTpass Integration Service
All VTU API calls go through here.
"""
import uuid
import logging
import requests
from decimal import Decimal
from django.conf import settings

logger = logging.getLogger('datashop')


class VTpassError(Exception):
    pass


class VTpassService:
    def __init__(self):
        self.api_key = settings.VTPASS_API_KEY
        self.public_key = settings.VTPASS_PUBLIC_KEY
        self.secret_key = settings.VTPASS_SECRET_KEY
        self.base_url = settings.VTPASS_BASE_URL
        self.headers = {
            'api-key': self.api_key,
            'public-key': self.public_key,
            'Content-Type': 'application/json',
        }

    def _generate_request_id(self):
        from django.utils import timezone
        now = timezone.now()
        return now.strftime('%Y%m%d%H%M%S') + uuid.uuid4().hex[:6].upper()

    def _post(self, endpoint, payload):
        try:
            resp = requests.post(
                f'{self.base_url}/{endpoint}',
                headers=self.headers,
                json=payload,
                timeout=60
            )
            resp.raise_for_status()
            data = resp.json()
            logger.debug(f'VTpass response [{endpoint}]: {data}')
            return data
        except requests.Timeout:
            raise VTpassError('VTpass request timed out. Please try again.')
        except requests.RequestException as e:
            logger.error(f'VTpass request error [{endpoint}]: {e}')
            raise VTpassError(f'VTU service error: {str(e)}')

    def _get(self, endpoint, params=None):
        try:
            resp = requests.get(
                f'{self.base_url}/{endpoint}',
                headers=self.headers,
                params=params,
                timeout=30
            )
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as e:
            logger.error(f'VTpass GET error [{endpoint}]: {e}')
            raise VTpassError(f'VTU service error: {str(e)}')

    def buy_data(self, phone, network, variation_code, amount, request_id=None):
        """Purchase data bundle."""
        network_map = {'mtn': 'mtn-data', 'airtel': 'airtel-data', 'glo': 'glo-data', '9mobile': 'etisalat-data'}
        service_id = network_map.get(network.lower(), f'{network.lower()}-data')
        payload = {
            'request_id': request_id or self._generate_request_id(),
            'serviceID': service_id,
            'billersCode': phone,
            'variation_code': variation_code,
            'amount': str(amount),
            'phone': phone,
        }
        data = self._post('pay', payload)
        return self._parse_response(data)

    def buy_airtime(self, phone, network, amount, request_id=None):
        """Purchase airtime."""
        network_map = {'mtn': 'mtn', 'airtel': 'airtel', 'glo': 'glo', '9mobile': 'etisalat'}
        service_id = network_map.get(network.lower(), network.lower())
        payload = {
            'request_id': request_id or self._generate_request_id(),
            'serviceID': service_id,
            'amount': str(amount),
            'phone': phone,
        }
        data = self._post('pay', payload)
        return self._parse_response(data)

    def verify_meter(self, meter_number, disco_code, meter_type='prepaid'):
        """Verify a meter number before purchasing electricity."""
        payload = {
            'billersCode': meter_number,
            'serviceID': disco_code,
            'type': meter_type,
        }
        data = self._post('merchant-verify', payload)
        if data.get('code') == '000':
            return {
                'valid': True,
                'customer_name': data['content']['Customer_Name'],
                'address': data['content'].get('Address', ''),
                'meter_number': meter_number,
            }
        return {'valid': False, 'message': data.get('content', {}).get('error', 'Invalid meter number')}

    def buy_electricity(self, meter_number, disco_service_id, meter_type, amount, phone, request_id=None):
        """Purchase electricity token."""
        payload = {
            'request_id': request_id or self._generate_request_id(),
            'serviceID': disco_service_id,
            'billersCode': meter_number,
            'variation_code': meter_type,  # prepaid or postpaid
            'amount': str(amount),
            'phone': phone,
        }
        data = self._post('pay', payload)
        result = self._parse_response(data)
        # Extract token from response
        if result['status'] == 'success':
            token = data.get('content', {}).get('transactions', {}).get('product_name', '')
            result['token'] = data.get('token', token)
        return result

    def buy_tv_subscription(self, smartcard_number, service_id, variation_code, amount, phone, request_id=None):
        """Subscribe to a TV plan."""
        payload = {
            'request_id': request_id or self._generate_request_id(),
            'serviceID': service_id,
            'billersCode': smartcard_number,
            'variation_code': variation_code,
            'amount': str(amount),
            'phone': phone,
            'subscription_type': 'change',
        }
        data = self._post('pay', payload)
        return self._parse_response(data)

    def verify_smartcard(self, smartcard_number, service_id):
        """Verify a TV smartcard number."""
        payload = {
            'billersCode': smartcard_number,
            'serviceID': service_id,
        }
        data = self._post('merchant-verify', payload)
        if data.get('code') == '000':
            return {
                'valid': True,
                'customer_name': data['content']['Customer_Name'],
                'current_bouquet': data['content'].get('Current_Bouquet', ''),
            }
        return {'valid': False, 'message': 'Invalid smartcard number'}

    def buy_exam_pin(self, product_code, variation_code, amount, phone, quantity=1, request_id=None):
        """Purchase exam pin."""
        payload = {
            'request_id': request_id or self._generate_request_id(),
            'serviceID': product_code,
            'variation_code': variation_code,
            'amount': str(amount),
            'phone': phone,
            'quantity': quantity,
        }
        data = self._post('pay', payload)
        result = self._parse_response(data)
        if result['status'] == 'success':
            result['pins'] = data.get('content', {}).get('transactions', {}).get('pins', [])
        return result

    def _parse_response(self, data):
        code = data.get('code', '')
        if code in ['000', '099']:  # 000=success, 099=success with delay
            return {
                'status': 'success',
                'transaction_id': data.get('content', {}).get('transactions', {}).get('transactionId', ''),
                'message': data.get('response_description', 'Transaction successful'),
                'raw': data,
            }
        elif code == '016':
            return {'status': 'failed', 'message': 'Transaction failed. Will be reversed.', 'raw': data}
        else:
            return {'status': 'failed', 'message': data.get('response_description', 'Unknown error'), 'raw': data}

    def get_service_variations(self, service_id):
        """Fetch available plans/variations for a service."""
        data = self._get('service-variations', params={'serviceID': service_id})
        return data.get('content', {}).get('varations', [])
