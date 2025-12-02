const ONESIGNAL_APP_ID = "b1cec79b-98e6-4881-ae74-8b626d302e15";
const REST_API_KEY = "os_v2_app_whhmpg4y4zeidlturnrg2mbocxwb5qyk7xreq7eka2nlw6ogqscn44xjsvg2ow4kbnc7t57sas72lzgfbhd7u7fe3x6dlmmmemxb7ma";

export const sendPushNotification = async (message: string) => {
    try {
        const options = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                Authorization: `Key ${REST_API_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                contents: { en: message },
                headings: { en: "¡Nueva Nota! 💌" },
                included_segments: ["All"]
            })
        };

        const response = await fetch('https://onesignal.com/api/v1/notifications', options);
        const data = await response.json();
        console.log('Notification sent:', data);
        return data;
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};
