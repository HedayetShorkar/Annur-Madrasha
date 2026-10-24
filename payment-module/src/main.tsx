import React from 'react';
import {createRoot} from 'react-dom/client';
import ReceiptDesk from './ReceiptDesk';
import './style.css';
import './receipts.css';
import './responsive.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><ReceiptDesk/></React.StrictMode>);
