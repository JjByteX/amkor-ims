import Modal, { ModalCancelButton } from '../UI/Modal';
import Button from '../UI/Button';

/**
 * ConfirmDialog — "Are you sure?" modal for destructive actions.
 *
 * Props:
 *   open        : bool
 *   onClose     : fn
 *   onConfirm   : fn
 *   title       : string   (default: 'Are you sure?')
 *   description : string   (optional body text)
 *   confirmLabel: string   (default: 'Confirm')
 *   cancelLabel : string   (default: 'Cancel')
 *   dangerous   : bool     (confirm button uses danger variant, default: true)
 *   loading     : bool     (confirm button loading state)
 */
export default function ConfirmDialog({
    open         = false,
    onClose,
    onConfirm,
    title        = 'Are you sure?',
    description  = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel  = 'Cancel',
    dangerous    = true,
    loading      = false,
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            size="default"
            footer={
                <>
                    <ModalCancelButton size="sm" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </ModalCancelButton>
                    <Button
                        variant={dangerous ? 'danger' : 'primary'}
                        size="sm"
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            {description && (
                <p className="font-body text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
        </Modal>
    );
}
