import React from "react";
import CookieConsent from "react-cookie-consent";

export class Footer extends React.Component {
    render() {
        const year = new Date().getFullYear();
        return (
            <>
                <CookieConsent>This website uses cookies to enhance the user experience.</CookieConsent>
                <div style={{ marginTop: "5px", textAlign: "center", color: "gray" }}>
                    Copyright &copy; 2018-{year} Washington University in St. Louis. All rights reserved.
                    <br /> Developed by the{" "}
                    <a href="http://wang.wustl.edu" target="_blank" rel="noopener noreferrer">
                        Wang Lab
                    </a>
                    <br /> <a href="LICENSE.html">Terms and Conditions of Use</a>
                </div>
            </>
        );
    }
}
