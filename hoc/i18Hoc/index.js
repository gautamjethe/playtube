import { I18n } from 'react-i18next';


class Dashboard extends Component {
    render() {
        return (
            <I18n>
                {(t) => (
                    <Chart t={t} />
                )}
            </I18n>
        );
    }
}